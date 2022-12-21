'use strict';

function waitobserve(startNode, query) {
  return new Promise((resolve, reject) => {
    let observer, timeoutID
    const callback = () => {
      const elements = query()
      if (elements != null && ('length' in elements && elements.length || !('length' in elements) && elements)) {
        if (observer) observer.disconnect()
        if (timeoutID) clearTimeout(timeoutID)
        resolve(elements)
      }
    }
    callback()
    observer = new MutationObserver(callback)
    observer.observe(startNode, { attributes: true, childList: true, characterData: true, subtree: true })
    if (window.wait_TIMEOUT) {
      timeoutID = setTimeout(() => {
        if (observer) observer.disconnect()
        if (timeoutID) clearTimeout(timeoutID)
        reject('Could not find elements.')
      }, window.wait_TIMEOUT)
    }
  })
}

async function wait(selector, startNode = document) {
  return waitobserve(startNode, () => startNode['querySelector'](selector))
}

// code from "fkunn1326/ai-arts"
function getHighlightNodes(basestr) {
  var temparr = []
  var tempobj = {
     type: "",
    values: []
  }
  var resultarr = []
  
  /*
  第一段階: 括弧だけ先に処理
  */
  
  function makeObj(obj) {
    if (tempobj.type === obj.type) {
      tempobj.values.push(obj.value)
    }else{
      temparr.push({
        type: tempobj.type,
        value: tempobj.values.join("")
      })
      tempobj = {
        type: obj.type,
        values: [obj.value]
      }
    }
  }
  
  basestr.split("").forEach((v, idx) => {
    var type = "text"
    if (["{", "}", "[", "]", "(", ")", ",", "|"].includes(v)){
      type = v
    }
    makeObj({
      type: type,
      value: v
    })
    if (idx === basestr.length - 1){ 
      temparr.push({
        type: tempobj.type,
        value: tempobj.values.join("")
      }); 
    }
  })
    
  /*
  第二段階: その他も処理
  */
  
  function makeSpanObj(value, classname){
    resultarr.push({
      "type": "element",
      "tagName": "span",
      "properties": {
        "className": [
          classname
        ]
      },
      "children": [
        {
          "type": "text",
          "value": value
        }
      ]
    })
  }
  
  function makeTextObj(value){
    resultarr.push({
      "type": "text",
      "value": value
    })
  }
  
  var andregex = /(AND)/
  var colonregex = /(\:(?:\d+\.?\d*|\.\d+))/
  var doublecolonregex = /(\:\:(?:\d+\.?\d*|\.\d+))/
  
  temparr.filter(Boolean).forEach((v) => {
    if (v.type !== "text"){
      switch(v.type){
        case "{":
          makeSpanObj(v.value, "text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-600")
          break;
        case "}":
          makeSpanObj(v.value, "text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-pink-300")
          break;
        case "[":
          makeSpanObj(v.value, "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600")
          break;
        case "]":
          makeSpanObj(v.value, "text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-300")
          break;
        case "(":
          makeSpanObj(v.value, "text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-sky-600")
          break;
        case ")":
          makeSpanObj(v.value, "text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-300")
          break;
        case ",":
          makeSpanObj(v.value, "text-gray-500")
          break;
        case "|":
          makeSpanObj(v.value, "text-orange-500")
          break;
      }
    }else{
      const flag = andregex.test(v.value) || colonregex.test(v.value) || doublecolonregex.test(v.value)
      if (flag){
        if(andregex.test(v.value)){
          v.value.split(andregex).forEach((v) => {
            if(andregex.test(v)){
              makeSpanObj(v, "text-orange-500")
            }else{
              makeTextObj(v) 
            }
          })
        }else if(doublecolonregex.test(v.value)){
          v.value.split(doublecolonregex).forEach((v) => {
            if(doublecolonregex.test(v)){
              makeSpanObj(v, "text-lime-500")
            }else{
              makeTextObj(v) 
            }
          })
        }else if(colonregex.test(v.value)){
          v.value.split(colonregex).forEach((v) => {
            if(colonregex.test(v)){
              makeSpanObj(v, "text-lime-500")
            }else{
              makeTextObj(v) 
            }
          })
        }
      }else{
        if (v.value !== undefined){
        	makeTextObj(v.value)
        }
      }
    }
  })

  return resultarr
}

function highlight(e){
    console.log(e.target.value)
    const elarr = []
    getHighlightNodes(e.target.value).map((el) => {
        if (el.type === "text"){
            elarr.push(`<p>${el.value}</p>`)
        }else if (el.type === "element"){
            elarr.push(`<p class="${el.properties.className}">${el.children[0].value}</p>`)
        }
    })
    pre.innerHTML = `<p>${elarr.join("")}</p>`
}

function handlescroll(e){
    console.log(e.target.scrollLeft)
    console.log(pre.scrollLeft)
    pre.scrollLeft = e.target.scrollLeft * 1.2
}

const input = document.querySelector("input[id='prompt-input-0']");
const style = document.createElement("style");
const pre = document.createElement("pre")
const code = document.createElement("code")

pre.appendChild(code)
style.innerHTML = `
#prompt-input-0 {
    caret-color: #fff;
    /*color: transparent;*/
    color: #00ff00;
}

pre {
    width: 100%;
    height: 100%;
    position: absolute;
    pointer-events: none;
    padding: 10px 21px;
    font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    font-size: 0.875rem;
    font-weight: normal;
    display: flex;
    align-items: center;
    justify-content: start;
    overflow: scroll;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

pre::-webkit-scrollbar {
    display:none;
}

pre > p {
    margin: 0px
}

.text-transparent {
    color: transparent;
}

.bg-clip-text {
    -webkit-background-clip: text;
}

.bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-pink-300 {
    --tw-gradient-from: #f9a8d4;
    --tw-gradient-to: rgb(249 168 212 / 0);
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-pink-600 {
    --tw-gradient-from: #db2777;
    --tw-gradient-to: rgb(219 39 119 / 0);
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.to-pink-300 {
    --tw-gradient-to: #f9a8d4;
}

.to-pink-600 {
    --tw-gradient-to: #db2777;
}

.from-yellow-300 {
    --tw-gradient-from: #fde047;
    --tw-gradient-to: rgb(253 224 71 / 0);
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.from-yellow-600 {
    --tw-gradient-from: #ca8a04;
    --tw-gradient-to: rgb(202 138 4 / 0);
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.to-yellow-300 {
    --tw-gradient-to: #fde047;
}

.to-yellow-600 {
    --tw-gradient-to: #ca8a04;
}

.from-sky-300 {
    --tw-gradient-from: #7dd3fc;
    --tw-gradient-to: rgb(125 211 252 / 0);
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
} 

.from-sky-600 {
    --tw-gradient-from: #0284c7;
    --tw-gradient-to: rgb(2 132 199 / 0);
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
}

.to-sky-300 {
    --tw-gradient-to: #7dd3fc;
}


.to-sky-600 {
    --tw-gradient-to: #0284c7;
}

.text-gray-500 {
    color: rgb(107 114 128);
}

.text-orange-500 {
    color: rgb(249 115 22);
}

.text-lime-500 {
    color: rgb(132 204 22);
}
`

document.body.appendChild(style)
input.parentElement.appendChild(pre)

input.addEventListener("input", highlight)
input.addEventListener("scroll", handlescroll)
input.addEventListener('keydown', async (e) => {
	if (e.shiftKey && e.key === 'Enter') {
		input.removeEventListener("input", highlight)
        await wait("textarea[id='prompt-input-0']")
        const textarea = document.querySelector("textarea[id='prompt-input-0']");
        console.log(textarea)
        textarea.addEventListener("input", highlight)
	}
});
console.log(input.parentElement)