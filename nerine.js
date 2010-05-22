
// Nerineオブジェクト
var Nerine = {
  parent: null,
  pages: [],
  now: null,
  page: -1,
  keyconfig: {
    indexMode: [38],
    nextPage: [39,76,32],
    prevPage: [37,72],
    toggleAspect: [65],
    reload: [82],
  },
  aspect: 0,
  aspects: [
    [4, 3],
    [16, 9],
    [16, 10]
  ],
  lines: 25,
  dialog: null,
  thumbnails: null,
  thumbnailNum: 5,
  modeIndex: false,
  // consts
  ASPECT_SDTV: 0,
  ASPECT_HDTV: 1,
  ASPECT_WUXGA: 2,
};

// ページオブジェクト
NerinePage = function(domObj){
  var obj = {};
  obj.dom = domObj;
  obj.jquery = $(domObj);
  obj.effects = $('[effect]', obj.jquery);
  obj.effecteds = $('[effected]', obj.jquery);
  obj.updateEffects = function(){
    this.effecteds = $('[effected]', this.dom);
  };
  return obj;
};

// リロード
Nerine.reload = function(){
  this.parent.load(location.href + " article section",{},function(){
    Nerine.page = -1;
    Nerine.pages = $('article > section').map(function(index,elm){ return(new NerinePage(elm)) });
    Nerine.initializeDialog();
    Nerine.resize();
    Nerine.showMessage('reloaded');
  });
};

// リサイズ
Nerine.resize = function(){
  var layer = [$(window).width(), $(window).height()];
  var aspect = this.aspects[this.aspect];
  if(layer[0]/aspect[0] > layer[1]/aspect[1]){
    layer[0] = (layer[1]/aspect[1])*aspect[0];
  }else{
    layer[1] = (layer[0]/aspect[0])*aspect[1];
  };
  this.parent.css({
    marginTop: -(layer[1]/2),
    marginLeft: -(layer[0]/2),
    width: layer[0],
    height: layer[1],
    fontSize: layer[1] / this.lines
  });
  this.dialog.css({
    lineHeight: this.dialog.height().toString() + 'px',
    marginTop: -(this.dialog.height()/2),
    marginLeft: -(this.dialog.width()/2),
    fontSize: this.dialog.height()/2,
  });
};

// アスペクト比の変更
Nerine.toggleAspect = function(){
  this.changeAspect(this.aspect+1);
};

Nerine.changeAspect = function(n){
  if(n >= this.aspects.length) n = 0;
  this.aspect = n;
  this.resize();
  var as = this.aspects[n];
  this.showMessage(['change Aspect: ', as[0], ':', as[1]].join(''));
};

// ダイアログの表示
Nerine.showMessage = function(message){
  this.dialog.html(message);
  this.dialog.stop().fadeTo('slow', 0.8).delay(400).fadeOut('normal');
};

// ページの移動
Nerine.nextPage = function(){
  if(this.now.effecteds.length == this.now.effects.length || this.modeIndex){
    this.movePage(this.page+1);
  }else{
    this.nextEffect();
  };
};

Nerine.prevPage = function(){
  if(this.now.effecteds.length == 0 || this.modeIndex){
    this.movePage(this.page-1);
  }else{
    this.prevEffect();
  };
};

Nerine.movePage = function(p){
  if(this.pages.length <= p || p < 0 || p == this.page){
    return;
  };
  if(this.now){
    this.now.jquery.removeClass('now');
  };
  this.now = this.pages[p];
  this.now.jquery.addClass('now');
  if(this.page > p) this.executeEffect(this.now.effects.length);
  if(this.page < p) this.executeEffect(0);
  this.page = p;
  location.hash = '#p'+this.page.toString();
  if(this.modeIndex) this.scroll(p);
};

// エフェクトの処理
Nerine.nextEffect = function(){
  this.executeEffect(this.now.effecteds.length+1);
};

Nerine.prevEffect = function(){
  this.executeEffect(this.now.effecteds.length-1);
};

Nerine.executeEffect = function(n){
  if(n > this.now.effecteds.length){
    var diff = n - this.now.effecteds.length;
    var effected = this.now.effecteds.length;
    for(var i=0; i<diff; i++){
      this.now.effects.eq(effected+i).attr('effected','effected');
    };
  }else{
    if(n < this.now.effecteds.length){
      var diff = this.now.effecteds.length - n;
      var effected = this.now.effecteds.length-1;
      for(var i=0; i<diff; i++){
        this.now.effects.eq(effected-i).removeAttr('effected');
      };
    };
  };
  this.now.updateEffects();
};

// インデックス
Nerine.indexMode = function(){
  if(!this.modeIndex){
    this.parent.addClass('index_mode');
    var scale = (100 / this.thumbnailNum) | 0;
    $('article > section').css({
      width: [scale-2, '%'].join(''),
      height: [scale-2, '%'].join(''),
      zoom: [scale-4, '%'].join(''),
      margin: '2%',
      padding: 0,
    });
    var len = this.pages.length;
    for(var i=0; i<len; i++){
      var x = ((i/this.thumbnailNum)|0) * scale;
      var y = ((i%this.thumbnailNum)|0) * scale;
      this.pages[i].jquery.css({
        top: x+'%',
        left: y+'%'
      });
    };
    this.scroll(this.page);
  }else{
    this.parent.removeClass('index_mode').css('padding',null);
    $('article > section').css({width:null,height:null,zoom:null,top:null,left:null,margin:null});
    this.scroll(0);
  };
  this.modeIndex = !this.modeIndex;
};
Nerine.scroll = function(to){
  var scrollTo = ((to/this.thumbnailNum)|0) * ((this.parent.height()/this.thumbnailNum)|0);
  this.parent.stop().animate({
    scrollTop: scrollTo
  });
};

// キーイベントの登録
Nerine.initializeKeyEvent = function(){
  $(document).keydown(function(ev){
    if(!Nerine.modeIndex){
      Nerine.keyconfig.__proto__ = null;
      for(var action in Nerine.keyconfig){
        var keys = Nerine.keyconfig[action];
        if(keys.indexOf(parseInt(ev.keyCode)) != -1){
          if(Nerine[action]()){return};
        };
      };
    }else{
      switch(ev.keyCode){
      case 38:
        Nerine.movePage(Nerine.page - Nerine.thumbnailNum);
        break;
      case 37:
        Nerine.prevPage();
        break;
      case 39:
        Nerine.nextPage();
        break;
      case 40:
        Nerine.movePage(Nerine.page + Nerine.thumbnailNum);
        break;
      case 13:
        Nerine.indexMode();
        break;
      };
    };
  });  
};

// リサイズイベントの登録
Nerine.initializeResizeEvent = function(){
  $(window).resize(function(){
    Nerine.resize();
  });
  this.resize();
};

// location.hashの監視
Nerine.monitorHash = function(){
  var hs = location.hash;
  if(/^#/.test(hs)) hs = hs.substring(1);

  if(hs == '') return;

  if(/^p(\d+)$/.test(hs)){
    Nerine.movePage(parseInt(RegExp.$1));
    return;
  };

  if(hs == 'top'){
    Nerine.movePage(0);
    return;
  };

  var length = Nerine.pages.length;
  for(var i=0; i<length; i++){
    if(Nerine.pages[i].jquery.attr('id') == hs) Nerine.movePage(i);
  };
};
Nerine.initializeHashManage = function(){
  setInterval(this.monitorHash, 10);
  this.monitorHash();
};

// ダイアログの用意
Nerine.initializeDialog = function(){
  this.dialog = $(document.createElement('div'));
  this.dialog.css({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '80%',
    height: '20%',
    textAlign: 'center',
    zIndex: -100,
    background: '#000',
    color: '#fff',
    'border-radius': '20px',
  });
  this.parent.append(this.dialog);
  this.dialog.fadeOut().css('z-index',100);
};

// 初期化
Nerine.initialize = function(){
  this.parent = $('article');
  this.pages = $('article > section').map(function(index,elm){ return(new NerinePage(elm)) });
  this.initializeDialog();
  this.initializeKeyEvent();
  this.initializeResizeEvent();
  this.initializeHashManage();
  if(this.page == -1) this.movePage(0);
};

// DOM Content Loaded
$(function(){
  Nerine.initialize();
});
