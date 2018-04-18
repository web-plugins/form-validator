
表单验证
===

项目需求中经常遇见的就是表单验证，这里参考Laravel的验证方式，实现一个在前端进行的表单验证插件。

## 更新
* `v2.0.0`重构大部分代码，移除jquery代码，采用原生DOM实现
* `v1.0.0`整个验证器以jQuery插件形式调用

## 使用方法

### 指定规则
使用`data-validate`以`key:value`形式指定规则，`key`表示验证规则，可使用内置的规则名称或自定义规则，`value`表示验证规则的第二个参数，比如最小长度为`5`
```html
<input data-validate="minLength:5" data-name="密码" type="text">
```
也可以一次性传入多条规则
```html
 <input data-validate="required is:password" data-name="姓名" type="text">
```

### 自定义验证规则
插件内置了一些常用的验证规则，也提供了扩展验证方法的接口

```js
let oForm = document.getElementById('testForm')
let validator = new Validator({
 	rules: {
        test: [function (val, param, el) {
            return false;
        }, function (msg) {
            alert("ID卡错误校验");
        }],
        minLength: [null, function(msg, param){
            alert("最小长度" + param)
        }],
    },
    continuable: false,
    showError: function(msg){
        alert(msg);
    }
})

validator.initWithForm(oForm)
```

### 构造参数配置
其中的配置参数包括：
* `rules`，传入一个对象，用于自定义或覆盖验证规则
    * `key`值表示对应的规则名称，用于在`data-validate`中使用
    * `value`值是一个包含两个函数的数组，
       * 第一个元素是验证规则，接收第一个参数为对应元素的值，第二个参数是验证规则的参数（自定义的时候一般没有必要设置），第三个参数是校验元素的`jQuery`包装对象，返回值为false或者undefined则表示验证不通过
       * 第二个元素是错误处理，接收第一个参数为对应元素的`jQuery`包装对象，第二个参数是验证时的参数
       * 如果只需要修改错误处理函数，则可以在验证规则使用`null`占位
* `continuable`，接受一个布尔值:
    * 为`true`时会验证所有条目（可显示所有错误）
    * 为`false`时验证到第一条不通过的规则就会返回（可尽快提示错误信息）
* `showError`，统一的错误处理函数，默认`console.log`，可以传入`alert`，`layer.msg`等处理函数。`showError`实际上会替换当前页面全部表单的错误反馈，
* `ajax`，是用于异步提交表单时的验证，该属性是一个函数，当验证通过时会执行该函数（同时取消表单默认提交）

## TODO
* [x] 常规的表单验证需求有:
     * minLength: 最小长度
     * maxLength: 最大长度
     * type： num数字 email邮箱 pwd密码 date日期 tel电话号码 idcard身份证
     * required： 必填
     * selected：选择
     * confirmed： 确认（未完成）
     * existed: 账号已存在（未完成）
* [x] 一条记录可能需要多条验证规则，可以使用`\s`进行分隔
* [x] 最后需要对验证结果进行反馈，以及通过验证之后的回调
* [x] ajax方式提交需要验证

## 思考
* 检测规则和错误反馈应当是分离还是封装在一起
* 规则在指定之后是固定不变的，而需要检测的值是随时可能发生改变的
* 需要灵活地让使用者自定义验证规则和错误反馈
* 错误反馈可能需要操作dom节点，因此需要留一个钩子