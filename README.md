# Next.js Web Decoder

## 錯誤內容

- 描述：Reader 元件 mount 第二次之後將無法正常運作

- 測試情境：
  1. 開啟 `http://localhost:3000/`，Reader 元件正常可以掃描，且打開 F12 的 Console 可以看到不斷有輸出訊息。
  2. 點擊 `Go to About Page`，再點擊 `Go to Home Page`，Reader 元件將無法正常掃描，且打開 F12 的 Console 會發現不會持續輸出訊息。
