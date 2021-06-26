import arknights from './plugins/arknights'
import bili from './plugins/bili'
import music from './plugins/music'
import rss from './plugins/rss'
import utils from './plugins/utils'

export default ctx => {
  arknights(ctx)
  bili(ctx)
  music(ctx)
  rss(ctx)
  utils(ctx)
}
