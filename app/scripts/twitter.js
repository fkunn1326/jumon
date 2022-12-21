'use strict';
import { loadPrompt } from "prompt_loader/npm"

var autoinput_select = undefined;
var autoinput_over = undefined;
var autoinput_format = undefined;
var autoinput = undefined;

chrome.storage.local.get(["autoinput_select", "autoinput_over", "autoinput_format", "autoinput"], function (value) {
    if (!value.autoinput_select || typeof value.autoinput_select !== "object"){
        chrome.storage.local.set({'autoinput_select': {
            "positive": true,
            "negative": true,
            "size": true,
            "seed": true,
            "steps": true,
            "scale": true,
            "sampler": true
        }}, function(){});
        autoinput_select = {
            "positive": true,
            "negative": true,
            "size": true,
            "seed": true,
            "steps": true,
            "scale": true,
            "sampler": true
        }
    }else{
        autoinput_select = value.autoinput_select;
    }

    if (!value.autoinput_over || typeof value.autoinput_over !== "string"){
        chrome.storage.local.set({'autoinput_over': "auto"}, function(){});
        autoinput_over = "auto"
    }else{
        autoinput_over = value.autoinput_over;
    }

    if (!value.autoinput_format || typeof value.autoinput_format !== "string"){
        chrome.storage.local.set({'autoinput_format': "Prompt: {{positive}}, Negative: {{negative}}, Sampler: {{sampler}}, Scale: {{scale}}, Seed: {{seed}}, Steps: {{steps}}, Size: {{size}}"}, function(){});
        autoinput_format = "Prompt: {{positive}}, Negative: {{negative}}, Sampler: {{sampler}}, Scale: {{scale}}, Seed: {{seed}}, Steps: {{steps}}, Size: {{size}}"
        autoinput_format = value.autoinput_format;
    }else{
        autoinput_format = value.autoinput_format;
    }

    if (value.autoinput == null || typeof value.autoinput !== "boolean"){
      chrome.storage.local.set({'autoinput': true}, function(){});
      autoinput = true
    }else{
        autoinput = value.autoinput;
    }
});

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

function genetaratetxt(obj){
  var finalPrompt = ""
  if (autoinput_format !== "Prompt: {{positive}}, Negative: {{negative}}, Sampler: {{sampler}}, Scale: {{scale}}, Seed: {{seed}}, Steps: {{steps}}, Size: {{size}}"){
    const keys = ["{{positive}}", "{{negative}}", "{{sampler}}", "{{scale}}", "{{seed}}", "{{steps}}", "{{size}}"]
    const values = [obj.positive, obj.negative, obj.samplingAlgorithm, obj.scale, obj.seed, obj.steps, `${obj.size.width}x${obj.size.height}`]
    var finalPrompt = autoinput_format
    for (let i = 0; i < keys.length; i++) {
      finalPrompt = finalPrompt.replace(keys[i], values[i]);
    }
  }else{
    var finalPromptarr = []
    finalPromptarr.push(autoinput_select.positive ? `Prompt: ${obj.positive}` : "")
    finalPromptarr.push(autoinput_select.negative ? `Negative: ${obj.negative}` : "")
    finalPromptarr.push(autoinput_select.sampler ? `Sampler: ${obj.samplingAlgorithm}` : "")
    finalPromptarr.push(autoinput_select.scale ? `Scale: ${obj.scale}` : "")
    finalPromptarr.push(autoinput_select.seed ? `Seed: ${obj.seed}` : "")
    finalPromptarr.push(autoinput_select.steps ? `Steps: ${obj.steps}` : "")
    finalPromptarr.push(autoinput_select.size ? `Size: ${obj.size.width}x${obj.size.height}` : "")
    finalPrompt = finalPromptarr.filter(str => str.length > 0).join(", ")
  }
  if (finalPrompt.length > 1000){
    if (autoinput_over === "none"){
      finalPrompt = ""
    }else if(autoinput_over === "auto"){
      finalPrompt = finalPrompt.substring(0, 1000)
    }
  }
  return finalPrompt
}

var result = []
var elems = []

async function handlechange(e){
  const chunks = await Promise.all(Array.from(e.target.files).map(async (file) => {
    const blob = await new Blob([file], {
        type: file.type,
    })
    const chunk = await loadPrompt(blob);
    return chunk
  }))
  result = [...result, ...chunks]

  const deletehandler = (e) => {
    document.querySelectorAll("div[aria-label='メディアを削除']").forEach((elem) => {
      elem.removeEventListener("click", deletehandler)
    })

    const deleteCallback = () => {
      if (elems !== Array.from(document.querySelectorAll("div[aria-label='メディアを削除']"))){
        elems = Array.from(document.querySelectorAll("div[aria-label='メディアを削除']"))
        document.querySelectorAll("div[aria-label='メディアを削除']").forEach((elem) => {
          elem.addEventListener("click", deletehandler)
        })
        result.splice(elems.indexOf(e.currentTarget), 1)
        clearInterval(interval)
      }
    }

    const interval = setInterval(deleteCallback, 50);
  }

  await wait("div[aria-label='メディアを削除']");
  elems = Array.from(document.querySelectorAll("div[aria-label='メディアを削除']"))
  document.querySelectorAll("div[aria-label='メディアを削除']").forEach((elem) => {
    elem.addEventListener("click", deletehandler)
  })

  var style = document.createElement("style")
  style.innerHTML = `
div:has(> div[data-testid='mask']) {
  visibility: hidden;
}

div[aria-label='メディアを編集'] {
  cursor: not-allowed;
  pointer-events-none;
}
`
  document.body.appendChild(style)
  
  setTimeout(() => {
    document.body.parentElement.style.overflow = "";
    document.body.parentElement.style.overscrollBehaviorY = "";
  }, 0)

  await wait("div[aria-label='メディアを編集']")
  document.querySelector("div[aria-label='メディアを編集']").click()
  
  await wait("div[data-testid='mask']");
  document.querySelector("div[data-testid='mask']").parentElement.style.display = "none";
  await wait("a[aria-label='画像の説明を編集']");
  document.querySelector("a[aria-label='画像の説明を編集']").click()

  for (var i=0; i<=result.length-1; i++){
    const obj = result[i]
    const finalPrompt = genetaratetxt(obj)
    setTimeout(() => { 
      const input = document.querySelector("textarea[name='altTextInput']")
      let lastValue = input.value;
      input.value = finalPrompt;
      const event = new Event('input', { bubbles: true });
      event.simulated = true;
      let tracker = input._valueTracker;
      if (tracker) {
        tracker.setValue(lastValue);
      }
      input.dispatchEvent(event);
      document.querySelector("div[aria-label='次の画像']").click()
    }, 0)
  }
  
  setTimeout(() => {
    document.querySelector("div[data-testid='endEditingButton']").click()
  }, 0)

  document.body.removeChild(style)
}

window.onload = function(){
  if (autoinput){
    function observe(){
      const element = document.querySelector("input[data-testid='fileInput']");
    
      if (element) {
        element.addEventListener("change", handlechange)
        observer.disconnect()
      }
    }

    const observer = new MutationObserver(observe)
    observer.observe(document.body, {childList: true, subtree: true})
  }
}