/*jshint esversion: 6*/

/************
  생성자 함수들
************/
//버튼 클릭 생성자 함수
function ClickElem(name) {
  this.name = name;
}
ClickElem.prototype.click = function(callback) {
  this.name.forEach(el => {
    el.addEventListener("click", (e, a)=>{
      callback(el);      
    });
  });    
};

/************
  미니 함수들
************/
// 클래스명 추가
function addClass(elem, className){
  elem.className += " " + className;
}
// 클래스명 제거
function removeClass(elem, className){
  elem.className = elem.className.replace(" " + className,"");
}
// 클래스값 가지고 있는지 체크
function hasClass(elem, className){
  let arr = elem.className.split(" ");
  if(arr.indexOf(className) > -1){
    return true;
  }else{
    return false;
  }
}
// 모든 엘리먼트 속성 제거
function removeAttrAll(elems, attr){
  elems.forEach(elem => {
    let thisAttr = elem.attributes[attr];
    if(thisAttr){      
      thisAttr.value = ""
    }
  });
}
// 속성값 가지고 있는 엘리먼트 겥
function getElByAttr(elems, attrName, attrValue){
  let that;
  elems.forEach(el => {
    if(el.attributes[attrName].value === attrValue){
      that = el;
    }
  });
  return that;
}
function toArr(elems){
  let newArr = [];
  elems.forEach(el=>{
    newArr.push(el);
  });
  return newArr;
}

/************
  재료들로 DOM 콘츄롤 
************/
// EVENT! 토글 버튼 클릭 시
const togLayerBtns = document.querySelectorAll("[data-role*='layertoggle']"),
      TogLayerBtn = new ClickElem(togLayerBtns),
      togLayers = document.querySelectorAll("[data-role*='layertarget']");

TogLayerBtn.click(el => {
  let i = el.dataset.index,
      thisLayer = getElByAttr(togLayers, "data-index", i);
  if(hasClass(thisLayer, "open")){
    removeClass(thisLayer, "open");
  }else{
    addClass(thisLayer, "open");
  }
});
// EVENT! 슬라이더
function Slider(el, ops){
  this.type = el.dataset.slider;
  this.wrap = el;
  this.slider = el.querySelector(".slider");
  this.slides = el.querySelectorAll(".slide");    
  this.viewport = el.querySelector(".view-slider");    
  this.arrows = el.parentNode.querySelectorAll(".arrow button");
  this.slidePerView = 1;    
  this.activeIdx = 0;
  this.transition = "all 0.5s ease";
  this.loop = true;
  if(ops){
    for(const op in ops){
      this[op] = ops[op];
    }
  }
}

let sliders = [];
const $sliders = document.querySelectorAll("[data-slider]");
$sliders.forEach(slider =>{
  let obj = new Slider(slider);
  sliders.push(obj);
});


Slider.prototype.setActive = function(target){
  // active 넘버에 따라 slide dataset 셋팅.
  target.slides[target.activeIdx].dataset.slide = "active";
};
Slider.prototype.startSlider = function(thumbSlider){
  if(this.loop){
    this.makeClones();
  }
  this.responsiveSize();
  window.addEventListener("resize", () =>{
    this.responsiveSize();
    this.slider.style.transition = "none"; //바뀐 슬라이드 사이즈에 맞춰 이동해줘
    this.changeTransform(this)
  });

  this.setActive(this);
  //전체 슬라이더 사이즈 
  this.slider.style.width = this.slides[this.activeIdx].offsetWidth * this.slides.length + "px";
  this.clickArrow(thumbSlider);
};
Slider.prototype.changeTransform = function(target){
  let slidePerView = target.slidePerView,
      i = target.activeIdx;
  if(slidePerView > 1 && i % slidePerView === slidePerView - 1) {
    sliding(slidePerView);
  }else if(slidePerView > 1 && i % slidePerView === 0){
    sliding();    
  }else if(slidePerView <= 1){
    sliding();
  }
  function sliding(moveNum){
    moveNum = moveNum || 1;
    target.slider.style.transform = "translate(-"+ target.slides[i].offsetWidth * (i - (moveNum - 1)) +"px)";
  }
};
Slider.prototype.sliding = function(target, activeIdx){
  removeAttrAll(target.slides, "data-slide");       
  target.activeIdx = activeIdx;
  this.setActive(target);
  if(target.fraction){
    this.showIdx(document.getElementById("uiCurrentIndex"));
  }     
  //window resizing 할때 transition제거 했으니 다시 transition 추가
  target.slider.style.transition = target.transition;
  this.changeTransform(target)
};
Slider.prototype.clickArrow = function(thumbSlider){
  const BtnArrow = new ClickElem(this.arrows);
  // 이 Arrow Click하면
  BtnArrow.click(el => {
    const where = el.dataset.btn,
          whenFirst = this.activeIdx === 0 && where === "prev",
          whenLast = this.activeIdx === this.slides.length-1 && where === "next";
    if(!this.loop && (whenFirst || whenLast)){
      return false;
    }else{
      //this.slides 의 data-slide 속성 remove
      this.sliding(this, this.changeActiveIdx(where));      
      // 쌍둥슬있으면 같이 움직
      if(thumbSlider){
        this.sliding(thumbSlider, this.activeIdx);
      }
    }
  });
};
Slider.prototype.showIdx = function(where){
  where.innerText = this.activeIdx + 1;
}
Slider.prototype.changeActiveIdx = function(btnType){
  let num,
      lastIdx = this.slides.length - 1;
  if(this.activeIdx == lastIdx && btnType == "next"){
    num = 0;
  }else if (this.activeIdx == 0 && btnType == "prev"){
    num = lastIdx;
  }else if(btnType == "next"){
    num = this.activeIdx + 1;
  }else if(btnType == "prev"){
    num = this.activeIdx - 1;
  }
  return num;
}; 
Slider.prototype.makeClones = function(){
  // loop일경우 처음과 끝 이어지게
  let clonePrev = this.slides[this.slides.length-1].cloneNode(true),
      cloneNext = this.slides[0].cloneNode(true);
  clonePrev.className += " clone";
  cloneNext.className += " clone";
  clonePrev.dataset.slide = "clone";
  cloneNext.dataset.slide = "clone";

  this.slider.insertBefore(cloneNext, this.slider.children[this.slides.length - 1].nextElementSibling);
  this.slider.insertBefore(clonePrev, this.slider.children[0]);      
};
Slider.prototype.responsiveSize = function(){
  let w, h;
  if(this.fullSize){
    w = window.innerWidth; h = window.innerHeight;
  }else if(this.slidePerView){
    let num = this.slidePerView;
    w = this.wrap.clientWidth / num;
  }
  this.slides.forEach(slide =>{
    slide.style.width = w+"px";      
    slide.style.height = h+"px";
  });
};
Slider.prototype.clickThumb = function(){
  if(this.thumbTarget){
    const $thumbs = this.wrap.querySelectorAll("button.thumb"), 
          thumbs = new ClickElem($thumbs),
          thumbArr = toArr(thumbs.name);
    thumbs.click((el) => {
      let i = thumbArr.indexOf(el);
      console.log(thumbArr)
      console.log(el)
      console.log(i)
      this.sliding(this, i);    
      this.sliding(this.thumbTarget, i);   
    });
  }
};
// 특정 객체 복사하여 새로운 객체 생성
// function copyObj(el, Obj){
//   let newObj = function(){
//     Obj.call(this, el);
//   }
//   return newObj;
// }
// 특정 개체의 프로토타입 복사하여 대상 객체에 적용
// function copyProto(Obj, ObjCopied){
  // ObjCopied.prototype = Object.create(Obj.prototype);
  // ObjCopied.prototype.constructor = ObjCopied;
  // return ObjCopied;
// }

// 슬라이더 오브젝트 생성
// FullSlider 객체 정의, 프로토타입 추가
// let FullSlider = copyObj($galleryMain , Slider)
// copyProto(Slider, FullSlider);

// ThumbSlider 객체 정의, 프로토타입 추가
// ThumbSlider = copyObj($galleryThumb , Slider);
// copyProto(Slider, ThumbSlider);
// ThumbSlider.prototype.slideSize = function(){
// };

const $galleryMain = document.querySelector(".galleryBody [data-slider]"),
      $galleryThumb  = document.querySelector(".thumbCont [data-slider]");

let galleryMain = new Slider($galleryMain, {
  fullSize: true,
  fraction: true
});
let galleryThumb = new Slider($galleryThumb, {
  loop: false,
  thumbTarget: galleryMain,
  fraction: true,
  slidePerView: 4,
});

galleryMain.startSlider(galleryThumb);
galleryThumb.startSlider(galleryMain);
galleryThumb.clickThumb();