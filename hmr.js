const fs = require('fs');
const { execSync } = require('child_process')
 
function watch(tgt, callback) {
    console.log('run replace.js watch mode')
    let lock = false;
    fs.watchFile(tgt, () => {
        if (lock) {
            return;
        }
        lock = true;
        try {
            const json = JSON.parse(fs.readFileSync("./dist/chrome/manifest.json", "utf8"));
            json["background"] = {
                "service_worker": "scripts/background.js"
            }
            fs.writeFileSync("./dist/chrome/manifest.json", JSON.stringify(json));
            const date = new Date();
            console.log(`\x1b[32m[${date}]:\x1b[39m File changed`)
        } finally {
            lock = false;
        }
    });
}

watch(__dirname + "/dist/chrome/manifest.json", () => console.log('changed manifest.json'))