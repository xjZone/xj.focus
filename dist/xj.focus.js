/** xj.focus(区分聚焦模式) | V0.3.0 | Apache Licence 2.0 | 2018-2021 © XJ.Chen | https://github.com/xjZone/xj.focus */
;(function(global, factory){
	if(typeof(define) === 'function' && (define.amd !== undefined || define.cmd !== undefined)){ define(factory) }
	else if(typeof(module) !== 'undefined' && typeof(exports) === 'object'){ module.exports = factory() }
	else{ global = (global||self), global.xj||(global.xj = {}), global.xj.focus = factory( ); };
}(this, function(){ 'use strict';



// Polyfill : matches & closest | V3.0.2
// jonathantneal - https://github.com/jonathantneal/closest，实际上插件还统一了 matches 方法
!function(){var a=window.Element.prototype;"function"!=typeof a.matches&&(a.matches=a.msMatchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||function(a){for(var b=this,c=(b.document||b.ownerDocument).querySelectorAll(a),d=0;c[d]&&c[d]!==b;)++d;return Boolean(c[d])}),"function"!=typeof a.closest&&(a.closest=function(a){for(var b=this;b&&1===b.nodeType;){if(b.matches(a))return b;b=b.parentNode}return null})}();

// Polyfill : classList V0.1.1
// 源自 xj.operate，解决 IE10 的 SVG 标签不支持 classList 对象的 3 个方法 : pub_hasClass() / pub_addClass() / pub_delClass()
var pub_hasClass,pub_addClass,pub_delClass;!function(){pub_hasClass=function(a,b){var c,d;return a.classList?a.classList.contains(b):(c=a.getAttribute("class"),d=c?c.split(/\s+/):[],-1===d.indexOf(b)?!1:!0)},pub_addClass=function(a,b){var c,d;return a.classList?a.classList.add(b):(c=a.getAttribute("class"),d=c?c.split(/\s+/):[],0===d.length?a.setAttribute("class",b):-1===d.indexOf(b)&&a.setAttribute("class",d.join(" ")+" "+b),void 0)},pub_delClass=function(a,b){var c,d;return a.classList?a.classList.remove(b):(c=a.getAttribute("class"),d=c?c.split(/\s+/):[],c="",-1!==d.indexOf(b)&&(d.forEach(function(a){a!==b&&(c+=a+" ")}),a.setAttribute("class",c.trim())),void 0)}}();



// ---------------------------------------------------------------------------------------------
// globalThis | window | self | global
var pub_global = (typeof(globalThis) !== 'undefined' ? globalThis : typeof(window) !== 'undefined' ? window : typeof(self) !== 'undefined' ? self : global);

// public nothing, version, keyword
var pub_nothing = function(){}, pub_version = '0.3.0', pub_keyword = 'focus';

// public config, advance set
var pub_config = {
	
	classTarget : document.documentElement,			// 要添加 existClass 类名的目标节点，默认是 html 标签节点，之所以不是 body 是因为插件初始化时 body 标签可能还未加载
	existClass : 'xj-focus-exist',					// 初始化后，targetClass 元素节点会被添加的类名，默认是 'xj-focus-exist'，可用于 CSS 判断环境是否存在 xj.focus 插件
	
	debug : false,									// 是否进入调试模式，默认为 false，如果将该属性设置为 true 则在触发 blur 事件之后，将不会自动删除 ontabClass(默认是 'xj-focus-ontab') 或 ontapClass(默认是 'xj-focus-ontap') 的类名，方便进行开发调试
	time : 200,										// 在这个时间内相继触发 tab / tap 事件和 focus 事件，那就认为这个 focus 事件是自然触发的，这主要是为了辨别出由 focus() 方法和浏览器自动引发的 focus 事件，这类事件得根据需要判断是当作 tap / tab 聚焦
	
	// 聚焦并不是只有被点击或按键盘的 Tab 键时才会发生，实际上还有其他情况，有些是浏览器自动的操作，有些则是由 JS 导致的，xj.focus 将这些情况也都考虑到了
	// 下面的这五个参数，是用于区分不同的场景之下，触发了 focus 聚焦事件后的响应模式，这些参数都有 3 个字符串值可选择，分别是 'ontab' / 'ontap' / 'other'
	// 如果是 'ontab'，那么元素聚焦后，默认会被添加 'xj-focus-ontab' 类名，如果使用了 xj.focus.css 文件，那么这个类名将导致被聚焦的元素显示出蓝色的外边框
	// 如果是 'ontap'，那么元素聚焦后，默认会被添加 'xj-focus-ontap' 类名，如果使用了 xj.focus.css 文件，那么这个类名会导致被聚焦的元素不显示出任何外边框
	// 如果是 'other'，那么元素聚焦后，默认会被添加 'xj-focus-other' 类名，实际上这相当于忽略这个 focus 事件，一般在 dispatchFocus 场景使用，不显示外边框
	initializedFocus : 'ontab',						// 当 focus 事件是由页面 ready 后浏览器自动触发(在 DOMContentLoaded 后 IE10/11 就会触发了)，该如何响应，默认是 'ontab'，这种情况下最好是让用户能明确页面所在的焦点，所以用 'ontab' 来强调外边框的存在
	visibilityFocus : 'ontab',						// 当 focus 事件是由于切换浏览器的 tab 标签，或浏览器最小最大化操作而触发的，该如何响应，默认是 'ontab'，这种情况下用户可能会忘记之前页面焦点位置，所以跟 initializedFocus 一样再次显示外边框提示
	automaticFocus : 'ontap',						// 当 focus 事件是由于聚焦到 devTool 面板或 URL 地址栏，然后再回到页面中导致的，该如何响应，默认是 'ontap'，因为这种情况往往是用户自己有意识的操作，并不需要额外的提醒，所以当作 'ontap' 即可
	dispatchFocus : 'other',						// 当 focus 事件是由 dispatchEvent() 方法触发的，该如何响应，默认是 'other'，因为这种触发方式并不会真的造成 UI 聚焦，执行后也无法自动再执行失焦，所以如果遇到的是这种情况，那就相当于忽略
	elementFocus : 'ontab',							// 当 focus 事件是由 Element.prototype.focus() 方法触发，该如何响应，默认是 'ontab'，因为这种情况下往往需要强调被聚焦的元素，所以用 'ontab'，就会显示出外边框，以此来加强对用户的提示
	
	ontabClass : 'xj-focus-ontab',					// 当使用键盘，按了 tab 或方向键而实现聚焦时，在被聚焦的元素节点上会被添加的类名，默认是 'xj-focus-ontab'
	ontapClass : 'xj-focus-ontap',					// 当使用了 touchstart 操作或 mousedown 操作，在被聚焦的元素节点上会被添加的类名，默认是 'xj-focus-ontap'
	otherClass : 'xj-focus-other',					// 当聚焦既不是键盘触发的，也不是 tap 触发的，在被聚焦的元素节点上会被添加的类名，默认是 'xj-focus-other'
	
	ontabFixedClass : 'xj-focus-ontab-fixed',		// 如果节点有这个类名，则聚焦时总会被当成 ontab 模式的聚焦，默认是 'xj-focus-ontab-fixed'，这个参数优先级最高
	ontapFixedClass : 'xj-focus-ontap-fixed',		// 如果节点有这个类名，则聚焦时总会被当成 ontap 模式的聚焦，默认是 'xj-focus-ontap-fixed'，这个参数优先级最高
	otherFixedClass : 'xj-focus-other-fixed',		// 如果节点有这个类名，则聚焦时总会被当成 other 模式的聚焦，默认是 'xj-focus-other-fixed'，这个参数优先级最高
	
	// 不管是由哪种方式触发了 focus 事件，如果触发事件的元素，符合这个数组中的选择器，那就会进入 ontab 的状态，默认值为 ['textarea', 
	// 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="image"])
	// :not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"])']
	// 基本原则就是，对于那些允许用户输入的元素，不管究竟由哪种操作模式导致的聚焦，总当作由 ontab 触发，也就是说聚焦时总会显示外边框
	ontabAlways : ['textarea', 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="image"]):not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"])'],
	
	// 不管是由哪种方式触发了 focus 事件，如果触发事件的元素，符合这个数组中的选择器，那就会进入 ontap 的状态，默认为 ['audio', 'video']
	// 之所以将 audio 和 video 设为总是 ontap，是因为 W3C 对 audio 和 video 的规范，这两个元素的鼠标事件和键盘事件都不生效，也不进行传递
	// 不管是冒泡还是捕获，不管是直接绑定还是间接绑定，mousedown / keydown 的事件都无法触发，根本就无法判断 focus 是由什么操作模式导致的
	// 最终只能是，这两个标签不管是由哪种形式触发的聚焦，总会进入 ontap 状态，将所有聚焦事件都当成是点击触发的，这样就统一了浏览器的结果
	ontapAlways : ['audio', 'video'],
	
	// 不管是由哪种方式触发了 focus 事件，如果触发事件的元素，符合下面这个数组中的选择器，那么就会进入 other 的状态，默认值为 ['area', 'svg a']
	// 之所以遇到 area 和 svg 中的 a 这两种元素就进入 other 状态，是因为这两种元素不能在 :focus{} 选择器规则中设置 outline 或 box-shadow 的样式
	// 如果进行设置，不单设置不会生效，还会导致原有的聚焦外边框样式失踪，这样聚焦后就没外边框了，尤其是 IE 和 Firefox，所以只好将这两个元素排除
	// 这样当我们设置了 .xj-focus-ontab:focus{} 和 .xj-focus-ontap:focus{} 的样式规则时，就不会对这个数组中对应的元素标签生效了，让他们保持默认
	otherAlways : ['area', 'svg a'],
	
	ontabCallback : pub_nothing,					// 这是当进入 ontab 状态下的回调，element 参数是导致函数触发的节点，你也可以借着这个节点自己进行进一步的判断，如果该函数最终返回的是 false，那么将会阻止本次进入 ontab 状态的操作
	ontapCallback : pub_nothing,					// 这是当进入 ontap 状态下的回调，element 参数是导致函数触发的节点，你也可以借着这个节点自己进行进一步的判断，如果该函数最终返回的是 false，那么将会阻止本次进入 ontap 状态的操作
	otherCallback : pub_nothing,					// 这是当进入 other 状态下的回调，element 参数是导致函数触发的节点，你也可以借着这个节点自己进行进一步的判断，如果该函数最终返回的是 false，那么将会阻止本次进入 other 状态的操作
	
};

// public option(00 items)
var pub_option = {};



// ---------------------------------------------------------------------------------------------
// 如果已经存在了就直接返回目标对象
if(pub_global.xj === undefined){ pub_global.xj = {} };
if(pub_global.xj.focusReturn === undefined){ pub_global.xj.focusReturn = {} };
if(pub_global.xj.focusReturn[pub_version] !== undefined){ return pub_global.xj.focusReturn[pub_version] };



// 创建并合并 config 和 option 参数
if(pub_global.xj.focusConfig === undefined){ pub_global.xj.focusConfig = {} };
if(pub_global.xj.focusOption === undefined){ pub_global.xj.focusOption = {} };
if(pub_global.xj.focusConfig[pub_version] !== undefined){ Object.keys(pub_global.xj.focusConfig[pub_version]).forEach(function(key){ pub_config[key] = pub_global.xj.focusConfig[pub_version][key] }) };
if(pub_global.xj.focusOption[pub_version] !== undefined){ Object.keys(pub_global.xj.focusOption[pub_version]).forEach(function(key){ pub_option[key] = pub_global.xj.focusOption[pub_version][key] }) };



// 创建页面最顶层四个全局节点的变量
var pub_win = pub_global;
var pub_doc = pub_win.document;
var pub_html = pub_doc.documentElement;
var pub_body = pub_doc.body;



// 这是插件执行后最终将会返回的对象
var pub_return = {
	
	// 当前的插件和配置对象的版本号
	version : pub_version,
	
	// 节点聚焦时究竟是哪种聚焦状态
	ontab : false,
	ontap : false,
	other : false,
	
	// 传入节点，将节点设置为 ontab
	ontabSet : function(element){
		if(pub_config.ontabCallback !== pub_nothing 
		&& pub_config.ontabCallback(element) === false){ return };
		pub_return.ontab = true;
		pub_return.ontap = false;
		pub_return.other = false;
		pub_addClass(element, pub_config.ontabClass);
		pub_delClass(element, pub_config.ontapClass);
		pub_delClass(element, pub_config.otherClass);
	},
	
	// 传入节点，将节点设置为 ontap
	ontapSet : function(element){
		if(pub_config.ontapCallback !== pub_nothing 
		&& pub_config.ontapCallback(element) === false){ return };
		pub_return.ontab = false;
		pub_return.ontap = true;
		pub_return.other = false;
		pub_delClass(element, pub_config.ontabClass);
		pub_addClass(element, pub_config.ontapClass);
		pub_delClass(element, pub_config.otherClass);
	},
	
	// 传入节点，将节点设置为 other
	otherSet : function(element){
		if(pub_config.otherCallback !== pub_nothing 
		&& pub_config.otherCallback(element) === false){ return };
		pub_return.ontab = false;
		pub_return.ontap = false;
		pub_return.other = true;
		pub_delClass(element, pub_config.ontabClass);
		pub_delClass(element, pub_config.ontapClass);
		pub_addClass(element, pub_config.otherClass);
	},
	
};



// ---------------------------------------------------------------------------------------------
// 变量和函数用于在 window 的 focus 事件中判断触发 focus 事件和 tap 事件的 target 是否是同个元素
// tap 事件和 focus 事件的 event.target 是同个元素，或者点击的是 label，才算是通过点击导致的聚焦
var pub_ontapNode = null;							// ontap 事件的 event.target 元素
var pub_sameTarget = function(focusTarget){			// 判断 tap 和 focus 是否同个元素
	
	var result = false;
	var element = pub_ontapNode;
	
	while(result === false && element !== null && element.nodeType === 1){
		if( /^label$/i.test( element.nodeName ) === true 
		|| element === focusTarget){ result = true }
		else{ element = element.parentElement };
	};
	
	return result;
	
};



// ---------------------------------------------------------------------------------------------
// 传入 initializedFocus, visibilityFocus, automaticFocus 等参数，根据这些参数判断应该执行的函数
// 如果执行了 focusResult() 函数，那肯定就是触发了 focus 事件，windowBlur 参数就应该恢复为 false
var pub_windowBlur = false;							// window 触发 blur 事件时为 true
var pub_focusResult = function(event, result){		// 传入聚焦的类型之后添加类名
	
	pub_windowBlur = false;
	
	switch(result){
		case 'ontab' : ontabListener(event, true); break;
		case 'ontap' : ontapListener(event, true); break;
		case 'other' : otherListener(event, true); break;
	};
	
};



// ---------------------------------------------------------------------------------------------
// 判断节点是否可修改，由于 input 和 textarea 有另外的判断方法，不需要这方法判断，所以返回 false
// IE11- 中输入控件的 isContentEditable 属性会受到 disabled 和 readOnly 影响，所以不能依靠这属性
// 测试发现 Firefox 和 Chrome，对于 contentEditable="true" 的元素，在获取 *-user-modify 样式时会
// 返回 "read-write"，子节点也会继承到这个结果，IE11- 不支持 user-modify，所以最终返回 undefined
var pub_prefixUserModify = (/Firefox/i.test(navigator.userAgent) === true ? 'MozUserModify' : 'webkitUserModify');
var pub_getStyleObject = function(element, pseudoSelector){ return pub_win.getComputedStyle(element, pseudoSelector ? pseudoSelector : null) };
var pub_isModifiable = function(element){
	if(/^input|textarea$/i.test(element.nodeName) === true){ return false };
	return (element.isContentEditable === true || (pub_doc.documentMode === undefined && /write/i.test(pub_getStyleObject(element)[pub_prefixUserModify]) === true)) ? true : false;
};

// ontab 事件的回调函数，得检测目标节点是否在 otherAlways | ontapAlways 数组中，是则进入其他回调
// 如果函数由 ontapListener() | otherListener() 调用就不再检查是否要进入其他逻辑，以免进入死循环
var ontabListener = function(event, check){
	
	var stop = false;
	var index = 0;
	var length = 0;
	
	if(check === true){
		
		for(index=0, length=pub_config.ontapAlways.length; index<length; index++){
			if(event.target.matches(pub_config.ontapAlways[index]) === true){
				ontapListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
		for(index=0, length=pub_config.otherAlways.length; index<length; index++){
			if(event.target.matches(pub_config.otherAlways[index]) === true){
				otherListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
	};
	
	pub_return.ontabSet(event.target);
	
};

// ontap 事件的回调函数，函数由 ontabListener() | otherListener() 调用就不再检查，以免进入死循环
// 新增 user-modify 样式和 isContentEditable 属性的判断，去掉了 ontabAlways 中的 contentEditable
var ontapListener = function(event, check){
	
	var stop = false;
	var index = 0;
	var length = 0;
	
	if(check === true){
		
		if(pub_isModifiable(event.target) === true){ return ontabListener(event, false) };
		
		for(index=0, length=pub_config.ontabAlways.length; index<length; index++){
			if(event.target.matches(pub_config.ontabAlways[index]) === true){
				ontabListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
		for(index=0, length=pub_config.otherAlways.length; index<length; index++){
			if(event.target.matches(pub_config.otherAlways[index]) === true){
				otherListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
	};
	
	pub_return.ontapSet(event.target);
	
};

// other 状态的设置函数，函数由 ontabListener() | ontapListener() 调用就不再检查，以免进入死循环
// 0.2.4- 之前的版本是直接调用 otherSet，现在新增了 other 类名，所以逻辑和上面的两个方法就一样了
var otherListener = function(event, check){
	
	var stop = false;
	var index = 0;
	var length = 0;
	
	if(check === true){
		
		if(pub_isModifiable(event.target) === true){ return ontabListener(event, false) };
		
		for(index=0, length=pub_config.ontabAlways.length; index<length; index++){
			if(event.target.matches(pub_config.ontabAlways[index]) === true){
				ontabListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
		for(index=0, length=pub_config.ontapAlways.length; index<length; index++){
			if(event.target.matches(pub_config.ontapAlways[index]) === true){
				ontapListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
	};
	
	pub_return.otherSet(event.target);
	
};



// ---------------------------------------------------------------------------------------------
// 在 IE10/11 中会有些标签，不能用 tab 键聚焦但可通过点击聚焦，所以需要改造 pub_focusResult 函数
// IE10/11，判断是否为 focusableTag 标签，不是则判断是否有 tabIndex 属性或是否可编辑，否定就无视
// 不单 initializedFocus 或 visibilityFocus 才执行，其他类型聚焦也可能出现这种情况，所以都要判断
// 被聚焦的节点是常规那些可被聚焦的节点，或是有 tabindex 属性且 >= 0，或是该节点是可被编辑的节点
(function(){

if(document.documentMode === undefined){ return };
var focusableTag = /^input|textarea|select|button|audio|video|area|svg|a|iframe|embed|object$/i;

var node = null;
var tabIndex = undefined;
pub_focusResult = function(event, result){
	
	pub_windowBlur = false;
	
	node = event.target;
	tabIndex = node.getAttribute('tabIndex');
	if(focusableTag.test(node.nodeName) === true || node.isContentEditable === true || 
	(tabIndex !== undefined && tabIndex !== null && tabIndex !== '' && tabIndex >= 0))
	{
		switch(result){
			case 'ontab' : ontabListener(event, true); break;
			case 'ontap' : ontapListener(event, true); break;
			case 'other' : otherListener(event, true); break;
		};
	};
	
};

})();



// ---------------------------------------------------------------------------------------------
// color 控件要 IE14 和 Safari12.1、12.2 才支持，不支持将 type="color" 从 ontabAlways 参数中去掉
// 支持 color 控件时 ! 会自动变成 #000000，IE 为 input 设置不支持的 type 会出错，得用 try…catch
// How to know if HTML5 input type color is available as a color picker ?
// https://stackoverflow.com/questions/13789163
(function(){
	
	var colorElement = null;
	var colorSupports = false;
	
	try{
		colorElement = 
		pub_doc.createElement('input');
		colorElement.type = 'color';
		colorElement.value = '!';
		colorSupports = (colorElement.type === 'color' && colorElement.value !== '!');
	}catch(e){};
	
	if(colorSupports === false){
		pub_config.ontabAlways.forEach(function (val, ind){
			if(val.indexOf(':not([type="color"])') !== -1){
				pub_config.ontabAlways[ind] = val.replace(':not([type="color"])', '');
			};
		});
	};
	
})();



// ---------------------------------------------------------------------------------------------
// 创建各种事件中记录时间用的变量，如果触发了目标事件，就更新时间变量，用于判断 focus 事件的间隔
// ready=DOMContentLoaded，visit=visibilitychange, ontab=keydown, ontap = mousedown / touchstart
var pub_readyTime = 0;
var pub_visitTime = 0;
var pub_ontabTime = 0;
var pub_ontapTime = 0;

pub_doc.addEventListener('DOMContentLoaded', function(event){
	if(event.isTrusted === false){ return };
	pub_readyTime = Date.now();
}, true);

pub_doc.addEventListener('visibilitychange', function(event){
	if(event.isTrusted === false){ return };
	pub_visitTime = Date.now();
}, true);

pub_doc.addEventListener('keydown', function(event){
	if([9,37,38,39,40].indexOf(event.keyCode) === -1
	|| event.isTrusted === false){ return };
	pub_ontabTime = Date.now();
}, true);

['mousedown', 'touchstart'].forEach(function(eventName){
	pub_doc.addEventListener(eventName, function(event){
		if(event.isTrusted === false){ return };
		pub_ontapNode = event.target;
		pub_ontapTime = Date.now();
	}, true);
});



// dispatchEvent(), DOMContentLoaded, visibilitychange, automatic, ontab, ontap, element.focus()
// 区分以上的七种聚焦触发方式进行操作，根据 pub_config.*Focus 参数，判断是要使用哪一种响应的模式
var pub_focusTime = 0;
pub_win.addEventListener('focus', function(event){
	
	// IE 和 Firefox 在进入页面后会自动触发 win 和 doc 聚焦
	// if(event.target === pub_win){ console.log('win focus') }
	// else if(event.target === pub_doc){ console.log('doc focus') }
	
	// type fixed tiem
	// 如果不是元素节点，例如说是 window 或 document，那么直接返回，这里不能清掉类名，否则有 BUG
	// 如果节点上有 fixed 类名，直接将这个节点进入对应的状态，不需要再继续判断，check 也为 false
	if(event.target.nodeType !== 1){ return };
	if(pub_hasClass(event.target, pub_config.ontabFixedClass) === true){ return ontabListener(event, false) };
	if(pub_hasClass(event.target, pub_config.ontapFixedClass) === true){ return ontapListener(event, false) };
	if(pub_hasClass(event.target, pub_config.otherFixedClass) === true){ return otherListener(event, false) };
	
	// dispatchFocus
	// 事件是由 JavaScript 脚本模拟的，那就根据参数 pub_config.dispatchFocus，确定是否要执行回调
	// dispatchEvent(focusEvent) 触发的聚焦不会自动失焦，所以 other 类名会一直到下次失焦时才去除
	if(event.isTrusted === false){
		// console.log('type : dispatchFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, pub_config.dispatchFocus);
		return;
	};
	
	// initializedFocus
	// 事件由 DOMContentLoaded 事件触发，只有 IE10/11 会在 ready 后进入这个逻辑，IE18 其实也触发
	// 但 IE18 是先实现 focus 再触发 DOMContentLoaded，顺序相反，所以最后判断到的是 elementFocus
	pub_focusTime = Date.now();
	if(pub_focusTime - pub_readyTime <= pub_config.time){
		// console.log('type : initializedFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, pub_config.initializedFocus);
		return;
	};
	
	// visibilityFocus
	// 事件由 visibilitychange 事件触发，早期 Firefox 的这个事件会有些异常，所以会进入 automatic
	// 到了 Firefox87 时逻辑才算正常，而 Safari 的 visibilitychange 事件有 BUG，所以不会进到这里
	if(pub_focusTime - pub_visitTime <= pub_config.time){
		// console.log('type : visibilityFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, pub_config.visibilityFocus);
		return;
	};
	
	// automaticFocus
	// 事件因为离开当前页面，例如点击 DevTool 面板或地址栏，然后点击页面滚动条，回到页面中而触发
	// 这种情况下会触发 window 的 blur 失焦事件，所以 pub_windowBlur 会等于 true，以此来进行判断
	if(pub_windowBlur === true){
		// console.log('type : automaticFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, pub_config.automaticFocus);
		return;
	};
	
	// keydown ontab
	// 事件是由于触发 keydown 事件而触发，并且 keyCode 是键盘的 tab 按键或上下左右的方向键而触发
	// 如果是由键盘导致的聚焦，那么除了 otherAlways 参数所设置的标签，其他标签都会显示出外边框的
	if(pub_focusTime - pub_ontabTime <= pub_config.time){
		// console.log('type : ontab ' + event.target.nodeName.toLowerCase())
		ontabListener(event, true);
		return;
	};
	
	// tapped ontap
	// 事件由 tap 触发，且点击和聚焦的是同个元素才算是由点击触发，之所以要判断事件是否为同个元素
	// 是因为可能通过点击聚焦到其他位置去， 唯一例外的是点击 label 标签，这依然是属于 ontap 模式
	if(pub_focusTime - pub_ontapTime <= pub_config.time && pub_sameTarget(event.target) === true){
		// console.log('type : ontap ' + event.target.nodeName.toLowerCase())
		ontapListener(event, true);
		return;
	};
	
	// elementFocus
	// 如果以上的情况都没有被匹配到，那么聚焦事件应该是由于执行 Element.prototype.focus() 触发的
	// 实际上 IE18 & Safari 在某些情况下，也有可能会因为误判而到达这里，或者是因为卡顿而到达这里
	// console.log('type : focus() ' + event.target.nodeName.toLowerCase());
	pub_focusResult(event, pub_config.elementFocus);
	
}, true);



// 触发 blur 先检测触发节点是否为 window，是则 windowBlurring 为 true，再聚焦就是 automaticFocus
// 接着将所有的状态都改为 false，并通过 querySelectorAll()，尝试选中并去掉所有可能存在的相关类名
var pub_ontabNodes, pub_ontapNodes, pub_otherNodes;
pub_win.addEventListener('blur', function(event){
	
	// 用于检测节点失焦之后的表现，输出目标的节点名称
	// if(event.target === pub_win){ console.log('win blur') }
	// else if(event.target === pub_doc){ console.log('doc blur') }
	// else{ console.log(event.target.nodeName.toLowerCase() + ' blur') };
	
	// 如果事件可信任且 event.target 为 window，那就是窗口失焦了，那么设置 pub_windowBlur = true
	if(event.isTrusted === true && event.target === pub_win){ pub_windowBlur = true };
	
	// dispatchEvent 触发的聚焦不会自动引发失焦，所以 other 的类名可能会一直在，直到再次触发失焦
	pub_return.other = false;
	pub_return.ontab = false;
	pub_return.ontap = false;
	if(pub_config.debug === true){ return };
	pub_ontabNodes = pub_doc.querySelectorAll('.'+pub_config.ontabClass);
	pub_ontapNodes = pub_doc.querySelectorAll('.'+pub_config.ontapClass);
	pub_otherNodes = pub_doc.querySelectorAll('.'+pub_config.otherClass);
	if(pub_ontabNodes.length > 0){ Array.prototype.forEach.call(pub_ontabNodes, function(node){ pub_delClass(node, pub_config.ontabClass) }) };
	if(pub_ontapNodes.length > 0){ Array.prototype.forEach.call(pub_ontapNodes, function(node){ pub_delClass(node, pub_config.ontapClass) }) };
	if(pub_otherNodes.length > 0){ Array.prototype.forEach.call(pub_otherNodes, function(node){ pub_delClass(node, pub_config.otherClass) }) };
	
}, true);



// 添加 existClass 类名
if(pub_config.classTarget !== null && pub_config.existClass !== ''){ pub_addClass(pub_config.classTarget, pub_config.existClass) };

// 返回对象
return pub_global.xj.focusReturn[pub_version] = pub_return;



})); // 插件结束


