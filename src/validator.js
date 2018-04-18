// 验证要求分隔符
const RULE_DELIMITER = " ",
    PARAM_DELIMITER = ":";

// 常见的正则校验
let is = {
    re: /^\/.*\/$/,
    num: /^\d+$/,
    password: /\d/,
    tel: /^1[34578][0-9]{9}$/,
    email: /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
};

// 内置检测规则
let defaultStrategies = {
    // 字段必需
    required: [function (val) {
        return val !== '';
    }],
    // 最小长度
    minLength: [function (val, len) {
        len = parseInt(len, 10);
        return val.length >= len;
    }],
    // 最大长度
    maxLength: [function (val, len) {
        len = parseInt(len, 10);
        return val.length <= len;
    }],
    // 固定长度
    length: [function (val, len) {
        len = parseInt(len, 10);
        return val.length === len;
    }],
    // 常见的正则校验，指定类型
    is: [function (val, type) {
        let re = is.re.test(type) ? eval(type) : is[type];
        return re.test(val);
    }],
    // 下拉选择
    selected: [function (val, placeholder) {
        return val !== placeholder;
    }],
    // 复选框和单选框
    checked: [function (val, param) {
        return this.checked;
    }],
    // 只想两个元素是否相同
    same: [function (val, selector) {
        let el = document.querySelector(selector)
        return val === el.value
    }]
}


export default class Validator {
    constructor(options) {
        this.cache = []
        this.validateStrategies = {}
        this.errStrategies = {}

        this.errorHash = {
            required: ':name必填',
            minLength: ':name最小长度为:val',
            maxLength: ':name最大长度为:val',
            length: ':name长度为:val',
            checked: '请勾选:name',
            is: '请输入合法的:name',
            selected: '请选择:name',
            same: ':name两次输入不一致'
        }

        // 内置策略
        this.extendStrategies(defaultStrategies)

        // 配置参数初始化
        this.init(options)
    }

    init(options = {}) {
        let {rules, isContinuous, ajax, showError} = options

        // 扩展自定义策略
        this.extendStrategies(rules)

        // 是否连续检测错误
        this.isContinuous = isContinuous
        // 是否进行表单异步提交
        this.ajax = ajax

        // 错误处理基础函数
        this.showError = showError || (errMsg => {
                console.log(errMsg)
            })
    }

    // 通过参数增添自定义策略
    // 参数类似于下列结构，多个自定义规则组成的对象，每个对象包括一条rule校验规则和一条err错误反馈
    /**
     * @param
     * {
            test: [function (val, param) {
                    return false;
                }, function (el) {
                    console.log("err");
                }]
            }
     }
     */
    extendStrategies(rules) {
        if (!rules) {
            return
        }

        let {validateStrategies, errStrategies} = this

        Object.keys(rules).forEach(key => {
            let strategy = rules[key]

            // 第一个是验证规则
            // 第二个是错误反馈
            let rule = strategy[0],
                err = strategy[1];

            rule && (validateStrategies[key] = rule);
            err && (errStrategies[key] = err);
        })
    }

    /**
     * 添加需要验证的规则
     * @param dom
     * @param name
     */
    add(dom, name) {
        // data-validate='required minLength:4'这样的形式
        let dataset = dom.dataset
        let validate = dataset.validate

        name = name || dataset.name

        if (!validate) {
            // no rule
            return
        }

        // 收集需要验证的dom规则
        this.cache.push((isContinuous) => {
            let rules = validate.split(RULE_DELIMITER)

            let result = true

            for (let i = 0; i < rules.length; ++i) {
                let item = rules[i]
                let [rule, ruleParam] = item.split(PARAM_DELIMITER)

                // 调用策略函数
                let validateStrategy = this.validateStrategies[rule]
                if (typeof validateStrategy !== 'function') {
                    throw new Error(`no validateStrategy for ${rule}`)
                }

                let value = dom.value

                // 验证策略的第一个参数是dom的value值
                // 验证策略的第二个参数是规则的额外参数
                result = validateStrategy.apply(dom, [value, ruleParam])
                if (!result) {
                    // 拼接错误消息提示模板
                    let errMsg = this.genErrorMsg(rule, name, ruleParam)
                    // 指定默认的错误处理函数
                    let errorStrategy = this.errStrategies[rule] || this.showError

                    // 错误反馈的第一个参数是拼接的错误消息
                    // 错误反馈的第二个参数是规则的额外参数
                    // 错误反馈的第三个参数是dom的value值
                    errorStrategy.apply(dom, [errMsg, ruleParam, value])

                    // 返回false表示验证没有通过
                    if (!isContinuous) {
                        break
                    }
                }
            }

            return result
        })
    }

    run(isContinuous = false) {
        let cache = this.cache
        let isFailed = false

        for (let i = 0; i < cache.length; ++i) {
            let validate = cache[i]
            let validateResult = validate(isContinuous)
            if (!validateResult) {
                isFailed = true
                // 是否进行连续校核
                if (!isContinuous) {
                    break
                }
            }
        }

        return isFailed;
    }

    // 验证整个表单的快捷方法
    initWithForm(oForm) {
        let aItems = oForm.querySelectorAll('[data-validate]')

        Array.from(aItems).forEach(dom => {
            this.add(dom)
        })

        oForm.addEventListener('submit', (e) => {
            // 校验失败
            if (this.run(this.isContinuous)) {
                e.preventDefault()
            } else {
                // 默认ajax提交
                if (typeof this.ajax === 'function') {
                    this.ajax.call(oForm)
                    e.preventDefault()
                }
                // 常规表单提交
            }
        })
    }

    // 提示信息
    genErrorMsg(rule, name, val) {
        let tpl = this.errorHash[rule]
        return tpl.replace(/:name/, name).replace(/:val/, val)
    }
}