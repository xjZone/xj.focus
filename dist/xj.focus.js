/** xj.focus(区分聚焦模式) | V0.4.0 | Apache Licence 2.0 | 2018-2022 © XJ.Chen | https://github.com/xjZone/xj.focus/ */
;(function(global, factory){
	if(typeof(define) === 'function' && (define.amd !== undefined || define.cmd !== undefined)){ define(factory) }
	else if(typeof(module) !== 'undefined' && typeof(exports) === 'object'){ module.exports = factory() }
	else{ global = (global||self), global.xj||(global.xj = {}), global.xj.focus = factory() };
}(this, function(){ 'use strict';



// Polyfill : closest & matches | V3.0.2
// jonathantneal - https://github.com/jonathantneal/closest，实际上这插件还统一了 matches() 方法
!function(){var a=window.Element.prototype;"function"!=typeof a.matches&&(a.matches=a.msMatchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||function(a){for(var b=this,c=(b.document||b.ownerDocument).querySelectorAll(a),d=0;c[d]&&c[d]!==b;)++d;return Boolean(c[d])}),"function"!=typeof a.closest&&(a.closest=function(a){for(var b=this;b&&1===b.nodeType;){if(b.matches(a))return b;b=b.parentNode}return null})}();

// Polyfill : classList for SVG | V0.1.2
// 解决 IE10 的 SVG 标签不支持 classList 对象 : pub_hasClass() | pub_addClass() | pub_delClass()
var pub_hasClass=function(a,b){var c,d;return a.classList?a.classList.contains(b):(c=a.getAttribute("class"),d=c?c.split(/\s+/):[],-1===d.indexOf(b)?!1:!0)},pub_addClass=function(a,b){var c,d;return a.classList?a.classList.add(b):(c=a.getAttribute("class"),d=c?c.split(/\s+/):[],0===d.length?a.setAttribute("class",b):-1===d.indexOf(b)&&a.setAttribute("class",d.join(" ")+" "+b),void 0)},pub_delClass=function(a,b){var c,d;return a.classList?a.classList.remove(b):(c=a.getAttribute("class"),d=c?c.split(/\s+/):[],c="",-1!==d.indexOf(b)&&(d.forEach(function(a){a!==b&&(c+=a+" ")}),a.setAttribute("class",c.trim())),void 0)};



// ---------------------------------------------------------------------------------------------
// globalThis, window, self, global
var pub_global = (typeof(globalThis) !== 'undefined') ? globalThis : (typeof(window) !== 'undefined') ? window : (typeof(self) !== 'undefined') ? self : global;

// public nothing, version, keyword
var pub_nothing = function(){}, pub_version = '0.4.0', pub_keyword = 'focus';

// public config
var pub_config = {
	
	classTarget : document.documentElement,		// 将被添加 existClass 配置的节点，默认是 html，不使用 body 是因为插件初始化的时候 body 可能还未加载，不推荐修改
	existClass : 'xj-focus-exist',				// 初始化后 classTarget 配置会被添加的类名，默认是 'xj-focus-exist'，可用于在 CSS 中判断是否有本插件，不推荐修改
	
	ontabClass : 'xj-focus-ontab',				// 当使用键盘按下了 Tab 或方向键而实现聚焦时，被聚焦节点会添加该类名，默认是 'xj-focus-ontab'，不推荐修改，因为不少 xj 插件都默认只响应该类名，如果需要配置其他类名可在 ontabCallback 回调中设置
	ontapClass : 'xj-focus-ontap',				// 当触发 touchstart 或 mousedown 实现聚焦时，被聚焦节点会添加该类名，默认是 'xj-focus-ontap'，不推荐修改，因为不少 xj 插件都默认只响应该类名，如果需要配置其他类名可在 ontapCallback 回调中设置
	otherClass : 'xj-focus-other',				// 当聚焦不是操作键盘也不是以上两种 tap 导致，被聚焦节点会添加该类名，默认是 'xj-focus-other'，不推荐修改，因为不少 xj 插件都默认只响应该类名，如果需要配置其他类名可在 otherCallback 回调中设置
	
	outlineClass : 'xj-focus-outline',			// style 参数被设置为 'outline' 时，聚焦后节点会被添加的类名，默认是 'xj-focus-outline'，不推荐修改，因为插件默认的 CSS 文件只会响应该类名的样式，如果你配置成其他类名，就需要自己重新编写样式了
	shadowClass : 'xj-focus-shadow',			// style 参数被设置为 'shadow' 时，聚焦后节点会被添加的类名，默认是 'xj-focus-shadow'，但不推荐修改，因为插件默认的 CSS 文件只会响应该类名的样式，如果你配置成其他类名，就需要自己重新编写样式了
	insetClass : 'xj-focus-inset',				// inset 参数如果被设置为 true，聚焦后节点会被添加这个类名，默认是 'xj-focus-inset'，但是不推荐修改，因为插件默认的 CSS 文件只会响应该类名的样式，如果你配置成其他类名，就需要自己重新编写样式了
	
	// 不管是由哪种方式触发了 focus 事件，如果触发事件的元素，符合这个配置中的选择器，那就会进入 ontab 的状态，默认值为 ['textarea', 'in
	// put:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="image"]):n
	// ot([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"])']
	// 基本原则就是，对于那些允许用户输入的元素，不管究竟是由哪种操作模式所导致的聚焦，总当作由 ontab 触发，也就是说聚焦时总会显示外边框
	ontabSelector : ['textarea', 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="image"]):not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"])'],
	
	// 不管是由哪种方式触发了 focus 事件，如果触发事件的元素，符合这个配置中的选择器，那就会进入 ontap 的状态，默认值为 (/MSIE|Trident|EDGE/i.te
	// st(navigator.userAgent) || /Apple/i.test(navigator.vendor)) ? [] : ['audio', 'video']，也就是说面对 IE, Edge, Safari 就不进行任何特殊设置
	// 而面对 Firefox & Chrome 则设定 audio, video 总为 ontap 的状态不显示外边框，这是因为 audio, video 根据标准，它们的键鼠事件都不会传递到上层
	// 所以也就无法判断 focus 聚焦究竟是由什么操作模式导致的，只能统一当作点击导致不显示外边框，而 IE, Edge, Safari 因为没按标准所以反而能够判断
	ontapSelector : (/MSIE|Trident|EDGE/i.test(navigator.userAgent) || /Apple/i.test(navigator.vendor)) ? [] : ['audio', 'video'],
	
	// 不管是由哪种方式触发了 focus 事件，如果触发事件的元素，符合这个配置中的选择器，那就会进入 other 的状态，将使用浏览器的默认边框，默认值为 ['svg a'
	// , 'map area']，也就是在 svg 中的 a 或者 map 中的 area 总会进入 other 状态，这是因为这两种节点都不能在 :focus{ } 伪类选择器规则中设置 outline 或者
	// box-shadow 的样式，设置不单不会生效，还会导致浏览器原本聚焦自带的外边框失踪，这样聚焦后就没外边框了，尤其是 IE 和 Firefox，所以只好将这它们都排除
	// 这样当我们设置了 .xj-focus-ontab:focus{} 和 .xj-focus-ontap:focus{} 的样式规则，就不会对这个配置中对应的 a 和 area 生效了，让他们继续保持默认即可
	otherSelector : ['svg a', 'map area'],
	
	// 允许用户输入的标签节点，除了 input 和 textarea 之外，还有那些被设置了 contentEditable="true" 属性的标签，以及那些被设置了 user-modify:'*write' 样式的标签
	// modifiableTag 配置用于控制对这些标签的聚焦表现，默认值为 'ontab'，也就是说不管聚焦是由什么操作形式导致的，都会进入 ontab 模式，此时聚焦时总会显示出外边框
	// 如果这里设置为 'ontap'，则是不管聚焦是由什么操作形式导致的，都会进入 ontap 模式，此时聚焦不显示出外边框，设置为 'other'，则不修改样式，保持浏览器默认状态
	// 如果这里设置为 'auto'，则不做任何特殊处理，此时进入什么状态，取决于聚焦究竟是什么操作形式导致的，是点击导致就进入 ontap 状态，是键盘导致则进入 ontab 状态
	modifiableTag : 'ontab',
	
};

// public option
var pub_option = {
	
	debug : false,					// 是否进入调试模式，默认是 false，设为 true，则触发 blur 事件后，将不会自动删除 ontabClass 或 ontapClass 类名，方便进行测试
	time : 250,						// 在该时间内相继触发键盘或点击以及聚焦事件，就认为聚焦是自然触发的，而不是由于执行了节点的 focus() 方法而触发的，默认是 250
	
	style : 'auto',					// 聚焦后外边框使用哪种样式，默认是 'auto'，也就是 Safari 和 inset 模式下的 Firefox 使用 'outline' 而其他情况下使用 'shadow'，这是因为 Safari 的表单控件不支持阴影，而 Firefox 的表单控件不支持 inset 的阴影
	inset : false,					// 聚焦后是否启用内嵌式边框，默认是 false，当聚焦节点所在容器设置 overflow:hidden; 时，外边框就可能会被裁剪掉，此时启用内嵌式边框可解决该问题，注意 IE14- 不支持 outline-offset 样式，只能用阴影来实现该功能
	
	ontabAlways : false, 			// 如果在节点的 xj-focus="{}" 中将该参数设置为 true，则聚焦时总会被当成是 ontab 模式的聚焦，默认是 false，这个参数优先级最高
	ontapAlways : false, 			// 如果在节点的 xj-focus="{}" 中将该参数设置为 true，则聚焦时总会被当成是 ontap 模式的聚焦，默认是 false，这个参数优先级最高
	otherAlways : false, 			// 如果在节点的 xj-focus="{}" 中将该参数设置为 true，则聚焦时总会被当成是 other 模式的聚焦，默认是 false，这个参数优先级最高
	
	ontabCallback : pub_nothing,	// 这是当进入 ontab 状态下的回调函数，function(element){ }，参数 element 是导致函数触发的节点，你也可以借着这个节点自己进行进一步的判断，如果该函数最终返回的是 false，那么将会阻止本次进入 ontab 状态的操作
	ontapCallback : pub_nothing,	// 这是当进入 ontap 状态下的回调函数，function(element){ }，参数 element 是导致函数触发的节点，你也可以借着这个节点自己进行进一步的判断，如果该函数最终返回的是 false，那么将会阻止本次进入 ontap 状态的操作
	otherCallback : pub_nothing,	// 这是当进入 other 状态下的回调函数，function(element){ }，参数 element 是导致函数触发的节点，你也可以借着这个节点自己进行进一步的判断，如果该函数最终返回的是 false，那么将会阻止本次进入 other 状态的操作
	
	// focus 聚焦并不是只有节点被点击了或按了键盘的 Tab 键才会发生，实际上还有其他情况，有些是浏览器自动的操作，有些则是由 JS 导致的，插件将这些情况也都考虑到了
	// 下面的这 5 个参数，是用于区分不同的场景之下，触发了 focus 聚焦事件后的响应模式，这些参数都有 3 个字符串值可供选用，它们分别是 'ontab' | 'ontap' | 'other'
	// 如果设为 'ontab'，那么元素节点聚焦后，默认会被添加 '.xj-focus-ontab' 类名，如果使用了 xj.focus.css 文件，那么这个类名将导致被聚焦的元素显示出蓝色的外边框
	// 如果设为 'ontap'，那么元素节点聚焦后，默认会被添加 '.xj-focus-ontap' 类名，如果使用了 xj.focus.css 文件，那么这个类名会导致被聚焦的元素不显示出任何外边框
	// 如果设为 'other'，那么元素节点聚焦后，默认会被添加 '.xj-focus-other' 类名，实际上这相当于忽略这个 focus 事件，一般在 dispatchFocus 场景使用，不显示外边框
	initializedFocus : 'ontab',		// 当聚焦事件是由页面 DOMContentLoaded 既 ready 后浏览器自动触发(在 DOMContentLoaded 后 IE10|11 中就会出现)该如何响应，默认是 'ontab'，此时最好能让用户能明确页面所在焦点，所以用 'ontab' 来强调外边框的存在
	visibilityFocus : 'ontab',		// 当聚焦事件是由于切换浏览器的 tab 标签或浏览器最小最大化操作而触发的(会伴随着 visibilitychange 事件响应)，该如何响应，默认是 'ontab'，这种情况下用户可能会忘记之前页面的焦点位置，所以再次显示出外边框提示
	automaticFocus : 'ontab',		// 当聚焦事件是由于聚焦到浏览器的 DevTool 面板或浏览器的 URL 地址栏，然后再回到页面中导致的，该如何响应，默认是 'ontab'，这样用 Tab 键从 DevTool 面板或 URL 地址栏切入页面时，首个被聚焦的元素将会显示外边框
	dispatchFocus : 'other',		// 当聚焦事件是由节点执行 dispatchEvent() 方法触发的，该如何响应，默认是 'other'，因为这种使用事件对象来触发方式并不会真的造成 UI 聚焦，执行后也无法自动再执行失焦，所以如果遇到的是这种情况，那就相当于忽略
	elementFocus : 'ontab',			// 当聚焦事件是由 Element.prototype.focus() 方法触发，该如何响应，默认是 'ontab'，因为手动执行了节点的 focus() 方法这种情况，往往是需要强调被聚焦元素的，所以使用 'ontab' 显示外边框，以此来加强对用户的提示
	
	inherit : true,					// 是否自动继承属性，默认是 true，如果节点的上层标签设置 xj-focus="{ }" 属性，那么该属性会被继承，除非子元素自己也设置了属性
	
};



// ---------------------------------------------------------------------------------------------
// 如果已经存在了就直接返回目标对象
if(pub_global.xj === undefined){ pub_global.xj = {} };
if(pub_global.xj.focusReturn === undefined){ pub_global.xj.focusReturn = {} };
if(pub_global.xj.focusReturn[pub_version] !== undefined){ return pub_global.xj.focusReturn[pub_version] };



// 创建并合并 config 和 option 对象
if(pub_global.xj.focusConfig === undefined){ pub_global.xj.focusConfig = {} };
if(pub_global.xj.focusOption === undefined){ pub_global.xj.focusOption = {} };
if(pub_global.xj.focusConfig[pub_version] !== undefined){ Object.keys(pub_global.xj.focusConfig[pub_version]).forEach(function(key){ pub_config[key] = pub_global.xj.focusConfig[pub_version][key] }) };
if(pub_global.xj.focusOption[pub_version] !== undefined){ Object.keys(pub_global.xj.focusOption[pub_version]).forEach(function(key){ pub_option[key] = pub_global.xj.focusOption[pub_version][key] }) };



// 创建页面最顶层四个全局节点的变量
var pub_win = pub_global;
var pub_doc = pub_win.document;
var pub_html = pub_doc.documentElement;
var pub_body = pub_doc.body;



// 用 pub_option.style 设置不同边框
var pub_isSafari = /Apple/i.test(navigator.vendor);
var pub_isFirefox = /Firefox/i.test(navigator.userAgent);
var pub_setStyle = function(element, style, inset){
	if(style === 'auto'){ style = ((pub_isSafari === true 
	|| (pub_isFirefox === true && inset === true)) ? 'outline' : 'shadow') };
	pub_addClass(element, style === 'shadow' ? pub_config.shadowClass : pub_config.outlineClass);
};



// 这是插件执行后最终将会返回的对象
var pub_return = {
	
	// 当前的插件和配置对象的版本号
	version : pub_version,
	
	// 节点聚焦时究竟是哪种聚焦状态
	ontab : false,
	ontap : false,
	other : false,
	
	// 传入节点，将节点设置为 ontab
	ontabSet : function(element, options){
		
		var option;
		if(!options){ option = element.xj_focus }else 
		if(!option){ option = element.xj_focus = getWholeOption(element, options) };
		if(option.ontabCallback !== pub_nothing && option.ontabCallback(element) === false){ return };
		
		pub_return.ontab = true;
		pub_return.ontap = false;
		pub_return.other = false;
		
		if(option.inset){ pub_addClass(element, pub_config.insetClass) };
		pub_setStyle(element, option.style, option.inset);
		
		pub_addClass(element, pub_config.ontabClass);
		pub_delClass(element, pub_config.ontapClass);
		pub_delClass(element, pub_config.otherClass);
		
	},
	
	// 传入节点，将节点设置为 ontap
	ontapSet : function(element, options){
		
		var option;
		if(!options){ option = element.xj_focus }else 
		if(!option){ option = element.xj_focus = getWholeOption(element, options) };
		if(option.ontabCallback !== pub_nothing && option.ontabCallback(element) === false){ return };
		
		pub_return.ontab = false;
		pub_return.ontap = true;
		pub_return.other = false;
		
		if(option.inset){ pub_addClass(element, pub_config.insetClass) };
		pub_setStyle(element, option.style, option.inset);
		
		pub_delClass(element, pub_config.ontabClass);
		pub_addClass(element, pub_config.ontapClass);
		pub_delClass(element, pub_config.otherClass);
		
	},
	
	// 传入节点，将节点设置为 other
	otherSet : function(element, options){
		
		var option;
		if(!options){ option = element.xj_focus }else 
		if(!option){ option = element.xj_focus = getWholeOption(element, options) };
		if(option.ontabCallback !== pub_nothing && option.ontabCallback(element) === false){ return };
		
		pub_return.ontab = false;
		pub_return.ontap = false;
		pub_return.other = true;
		
		if(option.inset){ pub_addClass(element, pub_config.insetClass) };
		pub_setStyle(element, option.style, option.inset);
		
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
	
	while(result === false && element !== null 
	&& element !== undefined && element.nodeType === 1){
		if( /^label$/i.test( element.nodeName ) === true 
		|| element === focusTarget){ result = true }
		else{ element = element.parentElement };
	};
	
	return result;
	
};



// ---------------------------------------------------------------------------------------------
// 判断节点是否可修改，由于 input 和 textarea 有另外的判断方法，不需要这方法判断，所以返回 false
// IE11- 中输入控件的 isContentEditable 属性会受到 disabled 和 readOnly 影响，所以不能依靠这属性
// 测试发现 Firefox 和 Chrome，对于 contentEditable="true" 的元素，在获取 *-user-modify 样式时会
// 返回 "read-write"，子节点也会继承到这个结果，IE11- 不支持 user-modify，所以最终返回 undefined
var pub_prefixUserModify = (/Firefox/i.test(navigator.userAgent) === true ? 'MozUserModify' : 'webkitUserModify');
var pub_getStyleObject = function(element, pseudoSelector){ return pub_win.getComputedStyle(element, pseudoSelector ? pseudoSelector : null) };
var pub_isModifiable = function(element){
	if(/^(input|textarea)$/i.test(element.nodeName) === true){ return false };
	return (element.isContentEditable === true || (pub_doc.documentMode === undefined && /write/i.test(pub_getStyleObject(element)[pub_prefixUserModify]) === true)) ? true : false;
};



// color 控件要 IE14+ 和 Safari12.X+ 才支持，不支持时将 type="color" 从 ontabSelector 参数中去掉
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
		pub_config.ontabSelector.forEach(function(value,index){
			if(value.indexOf(':not([type="color"])') !== -1){
				pub_config.ontabSelector[index] = value
				.replace(':not([type="color"])', '');
			};
		});
	};
	
})();



// ---------------------------------------------------------------------------------------------
// 传入 initializedFocus, visibilityFocus, automaticFocus 等参数，根据这些参数判断应该执行的函数
// 如果执行了 focusResult() 函数，那肯定就是触发了 focus 事件，windowBlur 参数就应该恢复为 false
var pub_windowBlur = false;							// window 触发 blur 事件时为 true
var pub_focusResult = function(event, result){		// 传入聚焦的类型参数之后添加类名
	
	pub_windowBlur = false;
	
	switch(result){
		case 'ontab' : ontabListener(event, true); break;
		case 'ontap' : ontapListener(event, true); break;
		case 'other' : otherListener(event, true); break;
	};
	
};



// 在 IE10|11 中会有些标签，不能用 tab 键聚焦但可通过点击聚焦，所以需要改造 pub_focusResult 函数
// 被聚焦的节点是常规那些可被聚焦的节点，或是有 tabindex 属性且 >= 0，或是该节点是可被编辑的节点
(function(){

if(pub_doc.documentMode === undefined){ return };
var focusabled = /^(input|textarea|select|button|audio|video|area|svg|a|iframe|embed|object)$/i;

var node = null;
var tabIndex = undefined;
pub_focusResult = function(event, result){
	
	pub_windowBlur = false;
	
	node = event.target;
	tabIndex = node.getAttribute('tabIndex');
	if(focusabled.test(node.nodeName) === true || node.isContentEditable === true || 
	(tabIndex !== void(0) && tabIndex !== null && tabIndex !== '' && tabIndex >= 0))
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
// ontab 事件的回调函数，检测目标是否在 ontapSelector | otherSelector 数组之中，是则进入其他回调
// 如果函数由 ontapListener() | otherListener() 调用就不再检查是否要进入其他逻辑，以免进入死循环
var ontabListener = function(event, check){
	
	var stop = false;
	var index = 0;
	var length = 0;
	
	if(check === true){
		
		if(pub_isModifiable(event.target) === true){
			if(pub_config.modifiableTag === 'ontab'){ return ontabListener(event, false) };
			if(pub_config.modifiableTag === 'ontap'){ return ontapListener(event, false) };
			if(pub_config.modifiableTag === 'other'){ return otherListener(event, false) };
		};
		
		for(index = 0, length = pub_config.ontapSelector.length; index < length; index++){
			if(event.target.matches(pub_config.ontapSelector[index]) === true){
				ontapListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
		for(index = 0, length = pub_config.otherSelector.length; index < length; index++){
			if(event.target.matches(pub_config.otherSelector[index]) === true){
				otherListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
	};
	
	pub_return.ontabSet(event.target);
	
};

// ontap 事件的回调函数，函数由 ontabListener() | otherListener() 调用就不再检查，以免进入死循环
// 新增 user-modify 样式和 isContentEditable 属性的判断，去掉 ontabSelector 中的 contentEditable
var ontapListener = function(event, check){
	
	var stop = false;
	var index = 0;
	var length = 0;
	
	if(check === true){
		
		if(pub_isModifiable(event.target) === true){
			if(pub_config.modifiableTag === 'ontab'){ return ontabListener(event, false) };
			if(pub_config.modifiableTag === 'ontap'){ return ontapListener(event, false) };
			if(pub_config.modifiableTag === 'other'){ return otherListener(event, false) };
		};
		
		for(index = 0, length = pub_config.ontabSelector.length; index < length; index++){
			if(event.target.matches(pub_config.ontabSelector[index]) === true){
				ontabListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
		for(index = 0, length = pub_config.otherSelector.length; index < length; index++){
			if(event.target.matches(pub_config.otherSelector[index]) === true){
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
		
		if(pub_isModifiable(event.target) === true){
			if(pub_config.modifiableTag === 'ontab'){ return ontabListener(event, false) };
			if(pub_config.modifiableTag === 'ontap'){ return ontapListener(event, false) };
			if(pub_config.modifiableTag === 'other'){ return otherListener(event, false) };
		};
		
		for(index = 0, length = pub_config.ontabSelector.length; index < length; index++){
			if(event.target.matches(pub_config.ontabSelector[index]) === true){
				ontabListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
		for(index = 0, length = pub_config.ontapSelector.length; index < length; index++){
			if(event.target.matches(pub_config.ontapSelector[index]) === true){
				ontapListener(event, false); stop = true; break; }; };
		if(stop === true){ return };
		
	};
	
	pub_return.otherSet(event.target);
	
};



// ---------------------------------------------------------------------------------------------
// 参考 xj.ripple 进行参数提取合并，不在 focus 事件执行，因为直接调用返回值对象的 3 个方法也要用
// 相比 xj.ripple 的做法，因为 window.parentElement 会返回 undefined，所以 evalNode 还得检测这个
var getWholeOption = function(target, options){
	
	// 每次都需要重新生成配置，因为每次聚焦失焦都是独立的，不能修改 pub_option，否则会相互影响到
	// 将 pub_option | inlineOption | options 三个对象都推入 optionList 数组中，最后遍历合并对象
	var optionList = [];	// 承载着参数的数组
	var option = {};		// 最终返回参数对象
	var evalNode = target;	// xj-focus="{ }"
	var evalText = '';		// {objectString}
	
	// 获取目标节点以及所有节点父元素的 xj-focus="{}" 内联属性，用 eval 解析成对象，也推入到数组
	// 由于 evalNode 必定是元素节点，所以遍历中也不需要再使用进行 evalNode.nodeType === 1 的判断
	while(evalNode){
		
		// 获取节点的内联属性解析成参数对象，eval 参数中加括号是为了让引擎识别为对象而不是代码块
		// 使用 unshift 方法添加到数组的左侧，是为了降低优先级，该数组的元素，将从左到右遍历覆盖
		evalText = evalNode.getAttribute('xj-focus') ;
		if(evalText !== '' 
		&& evalText !== null 
		&& evalText !== undefined){ 
		optionList.unshift(eval('('+evalText+')')) } ;
		
		// 没 xj-focus="{}" 内联属性，或是有内联属性且允许自动继承，就继续往上查找父节点内联属性
		// 如果 inhreit 参数为 false，那就是属性不再继承，那么就不再继续往上查找了，清空节点变量
		if(evalNode.hasAttribute('xj-focus') === false 
		|| optionList[0].inherit === void 0 
		|| optionList[0].inherit === true){
		evalNode = evalNode.parentElement }
		else{ evalNode = null };
		
	};
	
	// options 参数推到最后面去，因为它优先级最高，pub_option 参数推到最前面去，因为它优先级最低
	// 遍历数组 optionList，将数组中的对象合并到 option 对象中，之后聚焦就用 option 参数进行操作
	if(options !== null && options !== undefined){ optionList.push(options) };
	optionList.unshift(pub_option);
	optionList
	.forEach(function(param){
		Object.keys(param).forEach(function(key){ option[key] = param[key] });
	});
	return option;
	
};



// ---------------------------------------------------------------------------------------------
// dispatchEvent(), DOMContentLoaded, visibilitychange, automatic, ontab, ontap, element.focus()
// 区分以上的这七种聚焦触发方式再进行操作，根据 option.*Focus 参数，判断是要使用哪一种响应的模式
pub_win.addEventListener('focus', function(event){
	
	// IE 和 Firefox 在进入页面后会自动触发 win 和 doc 聚焦
	// if(event.target === pub_win){ console.log('win focus') }
	// else if(event.target === pub_doc){ console.log('doc focus') }
	
	// type fixed item
	// 如果不是元素节点，例如说是 window 或 document，那么直接返回，这里不能清掉类名，否则有 BUG
	// 如果节点上有 *Always 设置，直接将这个节点进入对应状态，不需要再继续判断，check 也为 false
	if(event.target.nodeType !== 1){ return };
	var option = event.target.xj_focus = 
	getWholeOption(event.target);
	if(option.ontabAlways === true){ return ontabListener(event, false) };
	if(option.ontapAlways === true){ return ontapListener(event, false) };
	if(option.otherAlways === true){ return otherListener(event, false) };
	
	// dispatchFocus
	// 事件是由 JavaScript 脚本模拟触发的，那就根据参数 option.dispatchFocus，确定是否要执行回调
	// dispatchEvent(focusEvent) 触发的聚焦不会自动失焦，所以 other 类名可能会到下次失焦时才去除
	if(event.isTrusted === false){
		// console.log('type : dispatchFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, option.dispatchFocus);
		return;
	};
	
	// initializedFocus
	// 事件由 DOMContentLoaded 事件触发，只有 IE10|11 会在 ready 后进入这个逻辑，IE18 其实也触发
	// 但 IE18 是先实现 focus 再触发 DOMContentLoaded，顺序相反，所以最后判断到的是 elementFocus
	var pub_focusTime = Date.now();
	if(pub_focusTime - pub_readyTime <= option.time){
		// console.log('type : initializedFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, option.initializedFocus);
		return;
	};
	
	// visibilityFocus
	// 事件由 visibilitychange 事件触发，早期 Firefox 的这个事件会有些异常，所以会进入 automatic
	// 到了 Firefox87 时逻辑才算正常，而 Safari 的 visibilitychange 事件有 BUG，所以不会进到这里
	if(pub_focusTime - pub_visitTime <= option.time){
		// console.log('type : visibilityFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, option.visibilityFocus);
		return;
	};
	
	// automaticFocus
	// 事件因为离开当前页面，例如点击 DevTool 面板或地址栏，然后点击页面滚动条，回到页面中而触发
	// 这种情况下会触发 window 的 blur 失焦事件，所以 pub_windowBlur 会等于 true，以此来进行判断
	if(pub_windowBlur === true){
		// console.log('type : automaticFocus ' + event.target.nodeName.toLowerCase())
		pub_focusResult(event, option.automaticFocus);
		return;
	};
	
	// keydown ontab
	// 事件是由于触发 keydown 事件而触发，并且 keyCode 是键盘的 tab 按键或上下左右的方向键而触发
	// 如果是由键盘导致的聚焦，那么除了 otherSelector 参数所设置的标签，其他标签都会显示出外边框
	if(pub_focusTime - pub_ontabTime <= option.time){
		// console.log('type : ontab ' + event.target.nodeName.toLowerCase())
		ontabListener(event, true);
		return;
	};
	
	// tapped ontap
	// 事件由 tap 触发，且点击和聚焦的是同个元素才算是由点击触发，之所以要判断事件是否为同个元素
	// 是因为可能通过点击聚焦到其他位置去， 唯一例外的是点击 label 标签，这依然是属于 ontap 模式
	if(pub_focusTime - pub_ontapTime <= option.time && pub_sameTarget(event.target) === true){
		// console.log('type : ontap ' + event.target.nodeName.toLowerCase())
		ontapListener(event, true);
		return;
	};
	
	// elementFocus
	// 如果以上的情况都没有被匹配到，那么聚焦事件应该是由于执行 Element.prototype.focus() 触发的
	// 实际上 IE18 & Safari 在某些情况下，也有可能会因为误判而到达这里，或者是因为卡顿而到达这里
	// console.log('type : focus() ' + event.target.nodeName.toLowerCase());
	pub_focusResult(event, option.elementFocus);
	
}, true);



// ---------------------------------------------------------------------------------------------
// 触发 blur 先检测触发节点是否为 window，是则 windowBlurring 为 true，再聚焦就是 automaticFocus
// 接着将所有的状态都改为 false，并通过 querySelectorAll()，尝试选中并去掉所有可能存在的相关类名
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
	
	var option = event.target.xj_focus;
	if(option && option.debug){ return }
	else{ delete event.target.xj_focus };
	
	var pub_ontabNodes = pub_doc.querySelectorAll('.' + pub_config.ontabClass);
	var pub_ontapNodes = pub_doc.querySelectorAll('.' + pub_config.ontapClass);
	var pub_otherNodes = pub_doc.querySelectorAll('.' + pub_config.otherClass);
	
	var pub_insetNodes = pub_doc.querySelectorAll('.' + pub_config.insetClass);
	var pub_shadowNodes = pub_doc.querySelectorAll('.' + pub_config.shadowClass);
	var pub_outlineNodes = pub_doc.querySelectorAll('.' + pub_config.outlineClass);
	
	if(pub_ontabNodes.length > 0){ Array.prototype.forEach.call(pub_ontabNodes, function(node){ if(node.xj_focus === undefined || node.xj_focus.debug !== true){ pub_delClass(node, pub_config.ontabClass) } }) };
	if(pub_ontapNodes.length > 0){ Array.prototype.forEach.call(pub_ontapNodes, function(node){ if(node.xj_focus === undefined || node.xj_focus.debug !== true){ pub_delClass(node, pub_config.ontapClass) } }) };
	if(pub_otherNodes.length > 0){ Array.prototype.forEach.call(pub_otherNodes, function(node){ if(node.xj_focus === undefined || node.xj_focus.debug !== true){ pub_delClass(node, pub_config.otherClass) } }) };
	
	if(pub_insetNodes.length > 0){ Array.prototype.forEach.call(pub_insetNodes, function(node){ if(node.xj_focus === undefined || node.xj_focus.debug !== true){ pub_delClass(node, pub_config.insetClass) } }) };
	if(pub_shadowNodes.length > 0){ Array.prototype.forEach.call(pub_shadowNodes, function(node){ if(node.xj_focus === undefined || node.xj_focus.debug !== true){ pub_delClass(node, pub_config.shadowClass) } }) };
	if(pub_outlineNodes.length > 0){ Array.prototype.forEach.call(pub_outlineNodes, function(node){ if(node.xj_focus === undefined || node.xj_focus.debug !== true){ pub_delClass(node, pub_config.outlineClass) } }) };
	
}, true);



// ---------------------------------------------------------------------------------------------
// 创建各种事件中记录时间用的变量，如果触发了目标事件，就更新时间变量，用于判断 focus 事件的间隔
// ready=DOMContentLoaded，visit=visibilitychange, ontab=keydown, ontap = mousedown | touchstart

var pub_readyTime = 0;
pub_doc.addEventListener('DOMContentLoaded', function(event){
	if(event.isTrusted === false){ return };
	pub_readyTime = Date.now();
}, true);

var pub_visitTime = 0;
pub_doc.addEventListener('visibilitychange', function(event){
	if(event.isTrusted === false){ return };
	pub_visitTime = Date.now();
}, true);

var pub_ontabTime = 0;
pub_doc.addEventListener('keydown', function(event){
	if([9,37,38,39,40].indexOf(event.keyCode) === -1
	|| event.isTrusted === false){ return };
	pub_ontabTime = Date.now();
}, true);

var pub_ontapTime = 0;
['mousedown', 'touchstart'].forEach(function(eventName){
	pub_doc.addEventListener(eventName, function(event){
		if(event.isTrusted === false){ return };
		pub_ontapNode = event.target;
		pub_ontapTime = Date.now();
	}, true);
});



// ---------------------------------------------------------------------------------------------
// 添加 existClass 类名
if(pub_config.classTarget !== null && pub_config.existClass !== ''){ pub_config.classTarget.classList.add(pub_config.existClass) };

// 返回对象
return pub_global.xj[pub_keyword+'Return'][pub_version] = pub_return;



})); // 插件结束


