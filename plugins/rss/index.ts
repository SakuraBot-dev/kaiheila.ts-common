import { ctx } from '../../lib/plugin'
import Parser from 'rss-parser'
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface RSSDatabase {
  [index: string]: {
    channels: string[],
    title: string,
    id: string,
    gid: string
  }
}

interface RSSList {
  channels: string[],
  title: string,
  id: string,
  gid: string
}

export default (ctx: ctx) => {
  try {
    mkdirSync(resolve('./data'))
  } catch (error) { }

  const parser = new Parser();

  const db: {
    cache: RSSDatabase,
    read: () => void,
    write: () => void
  } = {
    cache: {},
    read: () => {
      try {
        db.cache = JSON.parse(readFileSync(resolve(ctx.config.database)).toString())
      } catch (error) { }
    },
    write: () => {
      writeFileSync(resolve(ctx.config.database), JSON.stringify(db.cache))
    }
  }

  const rss = {
    searchById: (id: string) => {
      for (const url in db.cache) {
        if (db.cache[url].id === id) return url
      }

      return null
    },
    searchByChannel: (id: string): RSSList[] => {
      const result = []
      for (const url in db.cache) {
        if (db.cache[url].channels.includes(id)) result.push(db.cache[url])
      }

      return result
    },
    add: async (channel_id: string, url: string) => {
      if (db.cache[url]) {
        // 如果已经存在这个url就直接写入数据库
        if (!db.cache[url].channels.includes(channel_id)) db.cache[url].channels.push(channel_id)
        return db.write()
      }

      try {
        const data = await parser.parseURL(url)
        db.cache[url] = {
          title: data.title || 'Untitled',
          id: (Math.random()*1e17).toString(16),
          gid: '',
          channels: [ channel_id ]
        }

        db.write()
        rss.update()
        return '订阅成功'
      } catch (error) {
        return `订阅失败: 无法拉取订阅源`
      }
    },
    remove: async (channel_id: string, id: string) => {
      const url = rss.searchById(id)
      if (!url) return '没有找到这个订阅'
      if (!db.cache[url].channels.includes(channel_id)) return '你没有订阅这个url'

      db.cache[url].channels = db.cache[url].channels.filter(item_channel_id => {
        if (item_channel_id === channel_id) return false
        return true
      })

      db.write()

      return '删除成功'
    },
    update: async () => {
      ctx.logger.info('正在更新订阅...')
      for (const url in db.cache) {
        try {
          if (db.cache[url].channels.length === 0) {
            delete db.cache[url]
            continue
          }
          const result = await parser.parseURL(url)
          const gid = result.items[0].guid || result.items[0].link || null
          if (gid && db.cache[url].gid !== gid) {
            db.cache[url].gid = gid
            db.cache[url].channels.forEach(id => {
              const card = ctx.bot.getCardBuilder()

              card.addTitle('RSS')
              card.addSeparator()
              card.addRowFields(2, [{
                name: '订阅源',
                value: db.cache[url].title
              },{
                name: '标题',
                value: String(result.items[0].title)
              }, {
                name: '链接',
                value: `[点我](${result.items[0].link})`
              }])

              ctx.bot.Messages.sendMessage({
                type: 10,
                target_id: id,
                content: card
              })
            })
          }
        } catch (error) {
          ctx.logger.warn(`${url} 更新失败:`, error)
        }
      }
      db.write()
      ctx.logger.info('订阅更新完成!')
    }
  }

  setInterval(() => {
    rss.update()
  }, 30e3)

  db.read()
  rss.update()

  ctx.command(/^\/rss add (http(|s)\:\/\/\S+)$/, '/rss add <url>', '添加订阅', async (match, event, reply) => {
    const url = match[1]
    const result = await rss.add(event.target_id, url)
    reply(1, `[RSS] ${result}`)
  })

  ctx.command(/^\/rss remove (\S+)$/, '/rss remove <id>', '删除订阅', async (match, event, reply) => {
    const id = match[1]
    const result = await rss.remove(event.target_id, id)
    reply(1, `[RSS] ${result}`)
  })

  ctx.bot.on('message_btn_click', msg => {
    const data = msg.value.split('.')
    if (data[0] === 'rss' && data[1] === 'remove') {
      rss.remove(msg.target_id, data[2])
    }
  })

  ctx.command(/^\/rss list$/, '/rss list', '查看当前频道订阅的内容', async (match, event, reply) => {
    const result = await rss.searchByChannel(event.target_id)
    
    if (result.length === 0) {
      reply(1, '[RSS] 你还没有订阅任何内容')
      return
    }
    
    const cards = []
    
    for (const item of result) {
      const card = ctx.bot.getCardBuilder()
      card.addTitle(item.title)
      card.addSeparator()
      card.addRowFields(2, [{
        name: 'id',
        value: item.id
      }])
      cards.push(card)
    }

    reply(10, cards)
  })
}