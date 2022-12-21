var autoinput_select = undefined;
var autoinput_over = undefined;
var autoinput_format = undefined;
var autoinput_sites = undefined;

var currentTabId = "1"

chrome.storage.local.get(["autoinput_select", "autoinput_over", "autoinput_format", "autoinput_sites"], function (value) {
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
    }else{
        autoinput_format = value.autoinput_format;
    }
    if (!value.autoinput_sites || typeof value.autoinput_sites !== "object"){
        chrome.storage.local.set({'autoinput_sites': {
            "chichipui": false,
            "aipictors": false,
            "aivy": false,
            "aipic": false,
        }}, function(){});
        autoinput_sites = {
            "chichipui": false,
            "aipictors": false,
            "aivy": false,
            "aipic": false,
        }
    }else{
        autoinput_sites = value.autoinput_sites;
    }
});

function handlechange(k, v, obj=undefined, objk=undefined){
    if (obj) {
        obj[objk] = v
        chrome.storage.local.set({[k]: obj}, function(){});
    }else{
        console.log({[k]: v})
        chrome.storage.local.set({[k]: v}, function(){});
    }
}

window.onload = function(){
    document.querySelectorAll("section[data-bodyid]").forEach((elem) => {
        if (elem.dataset.bodyid !== currentTabId) {
            elem.style.display = "none"
        }else{
            elem.style.display = "block"
        }
    })
    document.querySelectorAll("input.tab").forEach((elem) => {
        elem.addEventListener('change', function(e) {
            currentTabId = e.target.dataset.tabid;
            document.querySelectorAll("section[data-bodyid]").forEach((elem) => {
                if (elem.dataset.bodyid !== currentTabId) {
                    elem.style.display = "none"
                }else{
                    elem.style.display = "block"
                }
            })
        });
    })
    document.querySelectorAll("input.autoinput_select").forEach((elem) => {
        elem.checked = autoinput_select[elem.dataset.name]
        elem.addEventListener('change', function() {
            handlechange("autoinput_select", elem.checked, autoinput_select, elem.dataset.name)
        });
    });
    document.querySelectorAll("input.autoinput_sites").forEach((elem) => {
        elem.checked = autoinput_sites[elem.dataset.name]
        elem.addEventListener('change', function() {
            handlechange("autoinput_sites", elem.checked, autoinput_sites, elem.dataset.name)
        });
    });
    document.querySelectorAll("input.autoinput_over").forEach((elem) => {
        elem.checked = autoinput_over === elem.dataset.name
        elem.addEventListener('change', function() {
            handlechange("autoinput_over", elem.dataset.name)
        });
    });
    document.querySelector("textarea.autoinput_format").value = autoinput_format
    document.querySelector("textarea.autoinput_format").addEventListener('input', function(e){
        handlechange("autoinput_format", e.target.value)
    })
    document.querySelector("button.resetbutton").addEventListener("click", function(e){
        document.querySelector("textarea.autoinput_format").value = "Prompt: {{positive}}, Negative: {{negative}}, Sampler: {{sampler}}, Scale: {{scale}}, Seed: {{seed}}, Steps: {{steps}}, Size: {{size}}"
    })
}