export interface ProxyConfigItem{
    protocol: string,
    host: string,
    port: 9000,
    auth: {
      username: string,
      password: string,
    }
}