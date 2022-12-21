var autoinput = undefined;

chrome.storage.local.get(["autoinput"], function (value) {
    if (value.autoinput == null || typeof value.autoinput !== "boolean"){
        chrome.storage.local.set({'autoinput': true}, function(){});
        autoinput = true
    }else{
        autoinput = value.autoinput;
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
    document.getElementById("settings").setAttribute("href", chrome.runtime.getURL('../pages/settings.html'));
    document.querySelector("input.autoinput").checked = autoinput;
    document.querySelector("input.autoinput").addEventListener('change', function(e){
        handlechange("autoinput", e.target.checked)
    })
}