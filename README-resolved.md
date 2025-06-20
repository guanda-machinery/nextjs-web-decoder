# Next.js Web Decoder

## 檔案架構

- `src/app/page.tsx`: 此為程式進入點，使用 `Reader` 來顯示解碼器。
- `src/features/FuncodeDecoder/index.tsx`: 此為解碼器的主組件，負責處理解碼邏輯，程式碼內容來自 Google Drive 提供的範例。

## 錯誤內容

### 無法讀取 localstorage

![01](./screenshots/01.png)

### 讀取 wasm 會報錯

![02](./screenshots/02.png)

## 修改內容

### 讀取 wasm 會報錯

![03](./screenshots/03.png)
- next必須使用完整的絕對路徑 /funcodeDecoder/encoding.js 來確保正確載入

### 無法讀取 localstorage

![04](./screenshots/04.png)
- 在next先檢查 window 是否存在

### delay屬性要是true

![05](./screenshots/05.png)
- 如果delay屬性是false預設是暫停元件