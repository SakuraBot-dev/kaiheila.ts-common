import got from "got"
import { ctx } from "../../lib/plugin"

export default (ctx: ctx) => {
  ctx.command(/^\/play (.*)$/, '/play <关键词>', '点歌', async (match, event, reply) => {
    const keyword = match[1]
    try {
      reply(1, '[Music] 正在点播歌曲...')
      const search: any = await got.get(`https://api.3m.chat/search?keywords=${encodeURIComponent(keyword)}&realIP=116.25.146.177`).json()
      const song = search.result.songs[0]
      
      const card = ctx.bot.getCardBuilder()

      card.addAudio(song.name, `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`, song.album.artist.img1v1Url)
      
      reply(10, card)
    } catch (error) {
      reply(1, '[Music] 点播失败')
    }
  })
}