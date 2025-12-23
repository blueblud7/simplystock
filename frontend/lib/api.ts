/**
 * API 유틸리티 함수
 */

/**
 * API URL을 생성합니다.
 * 환경 변수 NEXT_PUBLIC_API_URL이 설정되어 있으면 사용하고,
 * 없으면 기본값 http://localhost:8001을 사용합니다.
 * 
 * @param path API 경로 (예: "/api/market/overview")
 * @returns 전체 API URL
 */
export function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
  
  // path가 이미 http로 시작하면 그대로 반환
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // baseUrl의 마지막이 /로 끝나면 제거
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  
  // path가 /로 시작하지 않으면 추가
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * WebSocket URL을 생성합니다.
 * 
 * @param path WebSocket 경로 (예: "/ws")
 * @returns 전체 WebSocket URL
 */
export function getWsUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001";
  
  // path가 이미 ws:// 또는 wss://로 시작하면 그대로 반환
  if (path.startsWith("ws://") || path.startsWith("wss://")) {
    return path;
  }
  
  // baseUrl의 마지막이 /로 끝나면 제거
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  
  // path가 /로 시작하지 않으면 추가
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
}


