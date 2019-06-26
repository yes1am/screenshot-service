## 基于 [url-to-pdf-api](https://github.com/alvarcarto/url-to-pdf-api) 的 node 截图服务

基于该开源项目上添加修改，好用顺手。  
- [x]  add standard code lint
- [x]  共用browser实例及page-pool的方式优化性能
- [x]  支持添加proxy-server代理
- [x]  添加log4js方便调试
- [x]  支持模拟移动端
- [x]  移除navigationSuggestions

### 1. 开发  
#### 1.1 本地开发

**Install**  

```shell
npm install  
```  

**start**  

```shell
npm start
```  

**take a screenshot for www.baidu.com**

```
http://localhost:8080/api/render?url=https://www.baidu.com&output=screenshot
```  

#### 1.2 开发环境


根目录下 local_node_modules 目录为chromium安装包地址，本地开发需要下载对应系统的chromium,版本号为`puppeteer包中package.json中的puppeteer.chromium_revision`的值，解压移动到local_node_module即可。  

[mac下载地址](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Mac/)  
[linux下载地址](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Linux_x64/)  
[window下载地址](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Win/)  

**最终文件目录**
```
/local_node_module
----/ chrome-linux-version
----/ chrome-mac-version
----/ chrome-win-version
```  

更多详情可参考之前的博客: [部署截图服务踩坑记录](https://github.com/yes1am/blog/issues/9)  

### 2. 请求示例及参数解释  

#### 2.1 原理
在url的query中传入相应的参数，即能实现对应的功能，比如生成不同类型的文件，支持懒加载，添加cookie，添加自定义header等等  

#### 2.3 常用参数及解释

* url: 需要进行截图的页面url,如果该url包含 `&` 等特殊符号，**必须**先对url进行 `encodeURIComponent` 再传入。  

    如 `&url=https://www.baidu.com`  
* cookies: 如果设置该参数，则在访问截图url时，会带上该 cookie  

    如 `&cookies[0][name]=theme&cookies[0][value]=light&cookies[0][url]=http://www.baidu.com&cookies[0][expires]=1554899743`

    > cookie 不需要设置domain，只需设置name,value,url,expires等,其中url即为domain的值。参考: https://github.com/GoogleChrome/puppeteer/issues/1342#issuecomment-468968592  

* output: 输出的文件类型，不设置则输出`pdf`,输出PNG示例如下:  

    `&output=screenshot`  

* extHeader: 用于设置额外的请求头，需指定name和value,如设置请求头 `robot:puppeteer` 示例  

    `&extHeader.name=robot&extHeader.value=puppeteer`  

* screenshot.selector: 当只截取文档的某个dom元素时设置,该dom元素标识可以是唯一的class，或者id。  

    如`&screenshot.selector=.dashboard`, 则只截取dashboard元素的内容。

* scrollPage: 是否开启懒加载，默认不开启。开启示例如下:  

    `&scrollPage=true`  

* device: 用于模拟移动设备,传入设备标识，严格区分大小写。[查看设备列表](https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js)，如模拟iPhone 6示例如下：    

    `&device=iPhone 6`  


### 3. 注意事项  
若需要对A页面进行截图，则A页面所加载的资源，必须要能被截图服务访问到，以防内网访问不到外网资源，可通过添加代理的形式。

### 参考文档  
[url-to-pdf-api](https://github.com/alvarcarto/url-to-pdf-api)  
[puppeteer](https://zhaoqize.github.io/puppeteer-api-zh_CN/)