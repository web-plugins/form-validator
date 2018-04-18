// import $ from 'jquery'

import Validator from './src/validator'

let oForm = document.getElementById('testForm')
let validator = new Validator()

validator.initWithForm(oForm)

// $("#test").formValidate({
//     // rules: {
//     //     test: [function (val, param) {
//     //         return true;
//     //         // return false;
//     //     }, function (el) {
//     //         alert("ID卡错误校验");
//     //     }],
//     //     minLength: [null, function(el, param){
//     //         alert("最小长度" + param)
//     //     }],
//     // },
//     // continuable: false,
//     showError: function(msg){
//         alert(msg);
//     }
// });
// $("#test2").formValidate({
//     // rules: {
//     //     test: [function (val, param) {
//     //         return false;
//     //     }, function (el) {
//     //         alert("xxx");
//     //     }],
//     // },
//     continuable: false,
//     showError: function (msg) {
//         alert(msg);
//     },
//     ajax: function () {
//         console.log("ajax send");
//     }
// });
//
window.onerror = function (e) {
    console.log(e)
}