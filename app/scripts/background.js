browser.contextMenus.create({
  title : "画像のメタデータを表示",
  type : "normal",
  contexts : ["image"],
});

browser.contextMenus.onClicked.addListener(onClickHandler);

class PngParser {
  constructor(arrayBuffer) {
      this.arrayBuffer = arrayBuffer;
      this.dataView = new DataView(arrayBuffer, 0x08);
  }
  getDataURI() {
      return `data:image/png;base64,${btoa(Array.from(new Uint8Array(this.arrayBuffer), e => String.fromCharCode(e)).join(""))}`;
  }
  getUint32(offset) {
      return this.dataView.getUint32(offset, false);
  }
  getUint8(offset) {
      return this.dataView.getUint8(offset);
  }
  getChar(offset) {
      return String.fromCharCode(this.getUint8(offset));
  }
  getString(offset, number) {
      return Array(number).fill(0).map((v, i) => this.getChar(offset + i)).join("");
  }
  readChunk(offset) {
      let currentOffset = offset;
      const size = this.getUint32(currentOffset);
      currentOffset += 4;
      const type = this.getString(currentOffset, 4);
      currentOffset += 4;

      const dataOffset = currentOffset;
      currentOffset += size;

      const crc = this.getUint32(currentOffset);
      currentOffset += 4;
      return {
          size: size,
          type: type,
          crc: crc,
          dataOffset: dataOffset,
          endOffset: currentOffset,
      };
  }
  getChunks() {
      const chunks = [];
      let chunk = { size: 0, type: "", crc: 0, endOffset: 0x00 };
      while (chunk.type !== "IEND") {
          chunk = this.readChunk(chunk.endOffset);
          chunks.push(chunk);
      }
      return chunks;
  }
  gettEXt() {
      const chunks = this.getChunks();
      for (const chunk of chunks) {
          if (chunk.type === "tEXt") {
              let tEXt = this.getString(chunk.dataOffset, chunk.size);
              if (tEXt.slice(0, "parameters".length) != "parameters") {
                  return "";
              }
              const index_of_negative = tEXt.indexOf("Negative prompt:");
              const index_of_steps = tEXt.indexOf("Steps:");
              const prompt = tEXt.substring("parameters ".length, index_of_negative - 1);
              const negative = tEXt.substring(index_of_negative + "Negative prompt ".length, index_of_steps - 1);
              let result = { prompt: prompt, negative: negative };
              for (const d of tEXt.substring(index_of_steps - 1).split(",")) {
                  const data = d.split(":");
                  result[data[0].substring(1)] = data[1].substring(1);
              }
              return result;
          }
      }
      return "";
  }
}

async function onClickHandler(info, tab) {
  try {
    (async () => {   
      async function getImage() {
          const url = info.srcUrl
          const res = await fetch(url)
          const blob = await res.blob()
          return blob.arrayBuffer()
      }
      console.log(await getImage())
      const parser = new PngParser(await getImage());
      const tEXt = parser.gettEXt();
      if (tEXt === "") {
        alert("メタデータが見つかりませんでした。")
      }else{
        alert(`ポジティブプロンプト: ${tEXt.prompt}\nネガティブプロンプト: ${tEXt.negative}`)
      }
  })()
  } catch(error) {
  }
}