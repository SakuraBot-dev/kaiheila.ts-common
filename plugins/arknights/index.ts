import CardBuilder from "../../lib/bot/CardBuilder"
import { ctx } from "../../lib/plugin"
import * as arknights from './api'

export default (ctx: ctx) => {
  ctx.command(/^\/ak drop (.*)$/, '/ak drop <关键词>', '查询明日方舟素材掉率', async (match, event, reply) => {
    reply(1, '[Arknights] 正在查询...')
    const stats = {
      query: 0,
      startAt: new Date().getTime() / 1e3
    }
    
    const cardList: CardBuilder[] = []
    
    let dataList: any[] = []

    const p1: any[] = []
    const p2: any[] = []
    // 查询物品 id
    const result = await arknights.getItem(match[1])
    stats.query++
    if (result) {
      for (const index in result) {
        const item = result[index]
        // 查询物品掉落
        stats.query++
        const tmp = arknights.GetMatrix(item.itemId)
        p1.push(tmp)
        tmp.then(matrix => {
          if (matrix) {
            for (const index in matrix) {
              const e = matrix[index]
              const rate = e.quantity / e.times
              // 查询关卡信息
              stats.query++
              const tmp = arknights.getStagesByID(e.stageId)
              p2.push(tmp)
              tmp.then((stage: any) => {
                if (stage) {
                  const cost = Math.round((stage.apCost / rate) * 1e2) / 1e2
                  dataList.push({
                    name: `${item.name} | ${stage.code}`,
                    apCost: stage.apCost,
                    cost: cost,
                    dropRate: `${Math.round(rate * 1e4) / 1e2}%`
                  })
                }
              })
            }
          }
        })
      }

      Promise.all(p1).then(e => {
        Promise.all(p2).then(async e => {
          dataList = dataList.sort((a, b) => {
           return a.cost - b.cost
          }).slice(0, 3)

          for (const data of dataList) {
            const card = ctx.bot.getCardBuilder()
                  
            card.addTitle(data.name)
            card.addSeparator()
            card.addRowFields(3, [{
              name: '掉落率',
              value: data.dropRate
            },{
              name: '理智消耗',
              value: String(data.apCost)
            },{
              name: '平均单件消耗理智',
              value: String(data.cost)
            }])

            cardList.push(card)
          }

          const card = ctx.bot.getCardBuilder()
          card.addTitle('统计信息: ')
          card.addRowFields(2, [{
            name: '查询次数',
            value: String(stats.query)
          },{
            name: '查询耗时',
            value: `${Math.round(((new Date().getTime() / 1e3) - stats.startAt) * 1e6) / 1e6}s`
          }])
          cardList.push(card)

          reply(10, cardList)
        })
      })
    } else {
      reply(1, '[Arknights] 物品未找到 \n [Status] 请求次数: 1')
    }
  })
}