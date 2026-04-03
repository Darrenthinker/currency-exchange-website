/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** UniRate 备用接口密钥（浏览器直连，会暴露于前端包） */
  readonly VITE_UNIRATE_API_KEY?: string;
}
