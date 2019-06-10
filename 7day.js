const jieba = require('./src/jieba')
const api = require('./resource/live/json')
const ora = require('ora')
const { ensureDir } = require('fs-extra')
const { writeFile } = require('fs').promises

const spinner = ora('Loading Rooms').start()

;
(async () => {
  await ensureDir('results/7day')
  let timeTable = {}
  let timestamps = {}
  let rooms = await api.roomsRecords()

  spinner.succeed('Rooms Loaded')
  spinner.start('Preparing...')

  Object.keys(rooms).forEach(room => {
    rooms[room].forEach(time => {
      if (!timeTable[time]) {
        timeTable[time] = { rooms: [], timestamp: new Date(time).getTime(), time }
        timestamps[timeTable[time].timestamp] = time
      }
      timeTable[time].rooms.push(room)
    })
  })

  let startTime = Math.min(...Object.keys(timestamps))
  let endTime = Math.max(...Object.keys(timestamps))

  spinner.succeed('Ready')

  for (let currentTime = startTime; currentTime + 1000 * 60 * 60 * 24 * 6 <= endTime; currentTime += 1000 * 60 * 60 * 24) {
    spinner.start(`Analyzing: ${timestamps[currentTime]}`)
    let timesRoomsNeeded = [].concat(...Object.values(timeTable)
      .filter(({ timestamp }) => (currentTime <= timestamp && timestamp <= currentTime + 1000 * 60 * 60 * 24 * 6))
      .map(({ time }) => time)
      .map(time => timeTable[time].rooms.map(roomid => ({ roomid, date: time })))).map(({ roomid, date }) => api.read(roomid, date))

    timesRoomsNeeded = await Promise.all(timesRoomsNeeded)
    const allDanmaku = timesRoomsNeeded
      .map(({ danmaku }) => danmaku)
      .map(danmaku => danmaku.map(({ text }) => text))
      .map(danmaku => danmaku.join('\n'))
      .join('\n')

    let result = jieba(allDanmaku, 256)
    await writeFile(`results/7day/${timestamps[currentTime]}.json`, JSON.stringify(result))
    spinner.succeed(`Finnshed: ${timestamps[currentTime]}`)
  }
})()
