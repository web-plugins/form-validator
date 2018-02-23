!(function (factory) {
    if (typeof define === "function" && (define.amd || define.cmd)) {
        define(["jquery"], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = function (root, jQuery) {
            if (jQuery === undefined) {
                if (typeof window !== 'undefined') {
                    jQuery = require('jquery');
                } else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {

        factory(jQuery);
    }
})(function ($) {
    // 验证要求分隔符
    var RULE_DELIMITER = " ",
        PARAM_DELIMITER = ":";

    // 全局的错误反馈函数
    var showError = console.log;


    // 判断策略
    var is = {
        re: /^\/.*\/$/,
        num: /^\d+$/,
        password: /\d/,
        tel: /^1[34578][0-9]{9}$/,
        email: /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
    };

    // 正则对应的中文描述符
    var describle = {
        num: "数字",
        email: "邮箱",
        password: "密码",
        tel: "电话号码"
    };

    // 内置检测规则与错误处理
    var defaultStrategies = {
        // 字段必需
        required: [function (val) {
            return val !== '';
        }, function (el) {
            var name = el.data("name");
            showError("请将" + name + "补写完整");
        }],
        // 最小长度
        minLength: [function (val, len) {
            len = parseInt(len, 10);
            return val.length >= len;
        }, function (el, len) {
            var name = el.data("name");
            showError(name + "的长度应大于等于" + len + "位");
        }],
        // 最大长度
        maxLength: [function (val, len) {
            len = parseInt(len, 10);
            return val.length <= len;
        }, function (el, len) {
            var name = el.data("name");
            showError(name + "的长度应小于等于" + len + "位");
        }],
        // 固定长度
        length: [function (val, len) {
            len = parseInt(len, 10);
            return val.length === len;
        }, function (el, len) {
            showError("长度应等于" + len + "位");
        }],
        // 指定类型
        is: [function (val, type) {
            var re = is.re.test(type) ? eval(type) : is[type];
            return re.test(val);
        }, function (el, type) {
            showError("请输入合法的" + describle[type]);
        }],
        selected: [function (val, placeholder) {
            return val !== placeholder;
        }, function (el) {
            var name = el.data("name");
            showError("请选择" + name);
        }],
        checked: [function (val, param, el) {
            return el.is(":checked");
        }, function (el, param) {
            var name = el.data("name");
            showError("请勾选" + name);
        }],
        same: [function (val, param, el) {
            return val === $(param).val()
        }, function (el) {
            showError("两次" + el.data("name") + "不一致");
        }]
    };

    // ---------------------验证器---------------------- //

    var Validator = function () {
        this.cache = [];
        this.validateStrategies = {},
            this.errStategies = {};


        // 内置策略
        this.extendStrategies(defaultStrategies);
    };

    var pt = Validator.prototype;

    // 向验证器中添加规则
    /**
     *
     * @param 单个元素上的规则字符串，已被拆分成数组
     * @param 该元素对应的值
     * @param 该元素本身
     */
    pt.add = function (rules, value, el) {
        this.cache = [];
        for (var i = 0, rule; rule = rules[i++];) {
            this.cache.push({
                rule: rule,
                value: value,
                el: el,
            });
        }
    };

    // 执行验证
    pt.run = function () {
        var cache = this.cache,
            validateStrategies = this.validateStrategies,
            errStategies = this.errStategies,
            len = cache.length;

        for (var i = 0; i < len; ++i) {
            var validate = cache[i];

            var rule = validate.rule.split(PARAM_DELIMITER),
                value = validate.value,
                el = validate.el;

            // 拆分单条规则对应的校验方法和可能存在的参数
            var method = rule[0],
                param = rule[1];

            // 判断校验是否通过
            var msg = validateStrategies[method](value, param, el);
            if (!msg) {
                errStategies[method](el, param);
                return false;
            }
        }

        return true;
    };

    // 通过参数增添自定义策略
    // 参数类似于下列结构，多个自定义规则组成的对象，每个对象包括一条rule校验规则和1一条err错误反馈
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
    pt.extendStrategies = function (param) {
        var validateStrategies = this.validateStrategies,
            errStategies = this.errStategies;
        for (var key in param) {
            if (param.hasOwnProperty(key)) {
                // 第一个是验证规则
                // 第二个是错误反馈
                var rule = param[key][0],
                    err = param[key][1];

                rule && (validateStrategies[key] = rule);
                err && (errStategies[key] = err);
            }
        }
    };

    // 扩展jQuery插件方法
    /**
     * @param param 扩展内置策略工具
     * @param flag 每次检测只显示一条错误还是执行全部错误， 为true表示显示全部错误
     * @param log 统一的错误提示函数
     * @returns {*}
     */

    $.fn.formValidate = function (param) {
        var rules = param.rules || {},
            continuable = param.continuable,
            ajax = param.ajax,
            repeatSubmit = param.repeatSubmit || false; // 禁止重复提交

        if (param.showError) {
            showError = param.showError
        }

        return this.each(function () {
            var $form = $(this),
                $items = $form.find("[data-validate]");

            var validator = new Validator();
            validator.extendStrategies(rules);
            var isSubmit = false;
            // 统一检测
            $form.on("submit", function () {
                var noError = true;

                $items.each(function () {
                    var $this = $(this);

                    var rules = $this.data("validate").split(RULE_DELIMITER),
                        value = $.trim($this.val());

                    // 提取表单验证规则
                    validator.add(rules, value, $this);

                    if (!validator.run()) {
                        noError = false;

                        // 发现错误是否立即退出检测
                        if (!continuable) {
                            return false;
                        }
                    }
                });

                if (noError && !isSubmit) {
                    // 是否允许连续提交表单，默认禁止
                    if (!repeatSubmit) {
                        isSubmit = true;
                    }

                    if (typeof ajax === "function") {
                        ajax();
                        return false;
                    }

                    // 正常表单提交
                    return true;
                } else {
                    return false;
                }
            })
        })
    };
});