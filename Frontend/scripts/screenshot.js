const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

;(async ()=>{
  const outDir = path.join(__dirname,'..','screenshots')
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir)

  const urls = [
    'http://localhost:5173/',
    'http://localhost:5173/signin',
    'http://localhost:5173/signup',
    'http://localhost:5173/dashboard'
  ]

  const browser = await chromium.launch()
  const page = await browser.newPage({viewport:{width:1200,height:800}})
  for(const u of urls){
    try{
      await page.goto(u, {waitUntil:'networkidle'})
      const name = new URL(u).pathname.replace(/\//g,'') || 'landing'
      const file = path.join(outDir, `${name || 'landing'}.png`)
      await page.screenshot({path: file, fullPage: true})
      console.log('Saved', file)
    }catch(err){
      console.error('Failed to screenshot', u, err.message)
    }
  }
  await browser.close()
})()
