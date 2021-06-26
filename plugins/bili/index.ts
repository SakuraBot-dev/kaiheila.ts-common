import { ctx } from "../../lib/plugin";
import { bili } from "./api";

export default (ctx: ctx) => {
  ctx.command(/(a|A)(v|V)(\d+)/gm, 'AV号', '查看视频信息', async (match, event, reply) => {
    const aid = match[3]
    const data = await bili.video_aid(aid)
    if (!data) return

    const card = ctx.bot.getCardBuilder()

    card.addImages([ data.pic ])
    card.addKMarkdown(`**[${data.title}](https://b23.tv/${data.bvid})**`)
    card.addSeparator()
    card.addRowFields(2, [{
      name: 'UP主',
      value: data.owner.name
    }, {
      name: '投稿时间',
      value: `${new Date(data.pubdate * 1e3).toISOString().replace('T', ' ').replace(/\.\d+Z/, '')}`
    }, {
      name: '分区',
      value: data.tname
    }, {
      name: '获赞数',
      value: String(data.stat.like)
    }, {
      name: '投币数',
      value: String(data.stat.coin)
    }, {
      name: '简介',
      value: data.desc
    }])

    reply(10, card)
  })

  ctx.command(/BV(\w{10})/gm, 'BV号', '查看视频信息', async (match, event, reply) => {
    const bvid = match[1]
    const data = await bili.video_bvid(bvid)
    if (!data) return

    const card = ctx.bot.getCardBuilder()

    card.addImages([ data.pic ])
    card.addKMarkdown(`**[${data.title}](https://b23.tv/${data.bvid})**`)
    card.addSeparator()
    card.addRowFields(2, [{
      name: 'UP主',
      value: data.owner.name
    }, {
      name: '投稿时间',
      value: `${new Date(data.pubdate * 1e3).toISOString().replace('T', ' ').replace(/\.\d+Z/, '')}`
    }, {
      name: '分区',
      value: data.tname
    }, {
      name: '获赞数',
      value: String(data.stat.like)
    }, {
      name: '投币数',
      value: String(data.stat.coin)
    }, {
      name: '简介',
      value: data.desc
    }])

    reply(10, card)
  })
  
  ctx.command(/^今日新番$/, '今日新番', '查看B站今日新番', async (match, event, reply) => {
    const data: any = await bili.bangumi.today()
    const mapping: any = {
      1: '一',
      2: '二',
      3: '三',
      4: '四',
      5: '五',
      6: '六',
      7: '日'
    }

    if (data) {
      const week: string = mapping[data.day_of_week] || data.day_of_week
      const msg: string[] = []

      msg.push(`今天是 星期 ${week}, 将有 ${Object.keys(data.seasons).length} 部新番放送！`)

      Object.values(data.seasons).forEach((e: any) => {
        msg.push(`《${e.title}》将于 ${e.pub_time} 更新 ${e.pub_index}`)
      })

      reply(1, msg.join('\n'))
    } else {
      reply(1, '[Bilibili] 读取失败')
    }
  })
}