// Index template
console.log("Index loaded from template");
// 使用类型断言来解决 ImportMeta 类型上不存在 env 属性的问题
console.log((import.meta as any).env.VITE_TEST_ENV);
