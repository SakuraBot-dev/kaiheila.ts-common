import { ctx } from "../../lib/plugin"
import whoiser from 'whoiser'
import { create } from "../pastebin"

export default (ctx: ctx) => {
  const parserObj = (obj: any) => {
    const result: string[] = []
    const keys = Object.keys(obj)
    for (const key of keys) {
      if (typeof obj[key] === 'object') {
        result.push(`${key}: `)
        const r = parserObj(obj[key])
        for (const item of r) {
          result.push(`\t${item}`)
        }
      } else {
        result.push(`${key}: ${obj[key]}`)
      }
    }
  
    return result
  }

  ctx.command(/^\/ping$/, '/ping', 'pong!', async (match, event, reply) => {
    const start = new Date().getTime()
    const result = await ctx.bot.Messages.sendMessage({
      type: 1,
      target_id: event.target_id,
      content: 'pong!'
    })

    ctx.bot.Messages.updateMessage({
      msg_id: result.msg_id,
      content: `pong! (${(new Date().getTime() - start)/1e3}s)`
    })
  })

  ctx.command(/^\/whois (.*)$/, '/whois <IP/Domain/ASN>', 'Whois查询', async (match, event, reply) => {
    const msgid = await ctx.bot.Messages.sendMessage({
      type: 1,
      content: '[Whois] 查询中...',
      target_id: event.target_id
    })
    try {
      const result = await whoiser(match[1])
      const data = parserObj(result).join('\n')
      const url = await create(data, 'KirisameMarisa', 'text')
      ctx.bot.Messages.updateMessage({
        msg_id: msgid.msg_id,
        content: `[Whois] 结果过长，已上传至Ubuntu Pastebin，Url: ${url}`
      })
    } catch (error) {
      ctx.bot.Messages.updateMessage({
        msg_id: msgid.msg_id,
        content: '[Whois] 查询失败!'
      })
    }
  })
}