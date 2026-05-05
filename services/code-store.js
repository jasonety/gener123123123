// 인증 코드 저장소 (메모리)
const codeStore = new Map();

export function set(phoneNumber, code) {
  codeStore.set(phoneNumber, code);
}

export function get(phoneNumber) {
  return codeStore.get(phoneNumber);
}

export function remove(phoneNumber) {
  codeStore.delete(phoneNumber);
}

export function clear() {
  codeStore.clear();
}
