/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 배포 시 백엔드 절대 주소(비우면 same-origin 상대경로 사용) */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
