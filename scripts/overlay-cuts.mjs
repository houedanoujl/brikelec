import { readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { cutPaths } from '../app/utils/jigsaw.js'
const [,, id, out, x0, y0, w, h] = process.argv
const b64 = readFileSync(`/Users/bfaproduction/Documents/GitHub/brikelec/reference/${id}.jpg`).toString('base64')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="${w*4}" height="${h*4}">
<image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="900" height="600"/>
${cutPaths().map(d => `<path d="${d}" fill="none" stroke="red" stroke-width="0.6"/>`).join('')}
</svg>`
writeFileSync(out, new Resvg(svg).render().asPng())
