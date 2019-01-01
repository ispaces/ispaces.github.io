/*
 * Copyright © 2009, iSpaces. All Rights Reserved.
 * Unlicensed distribution, copying, reverse engineering, re-purposing or otherwise stealing of this code is a violation of copyright law.
 */
/**
 * Calendar
 *
 * @author  Dermot Doherty
 * @version 0.1 - 6/7/2009 11:43AM
 * @version 0.2 - 11/13/2009 6:44AM

http://developer.yahoo.com/yui/examples/calendar/japan.html
 */

/* Calendar Constants */
var ST='st',ND='nd',RD='rd';
var YEAR='year',MONTH='Month',WEEK='Week',DAY='Day',TODAY='Today';
var COMMASPACE=', ';
var F7F7F7='#f7f7f7';
var CCC1='#ccc 1px solid';

ISPACES.Calendar=function(o){
  ISPACES.log.debug(this.classId+'.ctor('+o+')');

  ISPACES.Ap.apply(this,arguments); // Call super constructor.

  //this.o=o;
  //this.x=this.o.x||this.create.randomInt();
  this.id=this.classId+this.x;
  ISPACES.log.alert(this.classId+'('+o+'): this.id = '+this.id);

  //if(options.count)this.count=options.count;
  if(o._xy)this._xy=o._xy;
  if(o.isNew)this.isNew=o.isNew;
  //if(o.count)this.count=o.count;
  if(o._xy)this._xy=o._xy;
  if(o.isNew)this.isNew=o.isNew;

  //ISPACES.log.alert(this.classId+'.ctor('+options+'): this.count = '+this.count+', this.isNew = '+this.isNew+', this._xy = '+this._xy);

  //this.store=new Persist.Store(this.classId);
  this.windowHeight=400;
  this.windowWidth=800;
  this.entriesName='entries';

  var options={
    top:33
    ,left:33
    ,showButtons:true
  };

  /*
  var windowcalendarXY=ISPACES.system.store.get('windowcalendarXY');
  ISPACES.log.debug(this.classId+'.ctor('+id+'): windowcalendarXY = '+windowcalendarXY);
  //Common.extend(this,eval(windowcalendarXY));
  //Common.extend(this,JSON.parse(windowcalendarXY));
  Common.extend(options,JSON.parse(windowcalendarXY));
  */

  this.windowTitle=ISPACES.JSONS.Titles[this.classId]();

  //this.resizableWindow=new ISPACES.ResizableWindow(this.objectId+'-window','Calendar',options);
  //this.resizableWindow=new ISPACES.ResizableWindow(this,{left:this.XY[0],top:this.XY[1],showButtons:true});
  //this.resizableWindow=new ISPACES.ResizableWindow(this,options);
  var resizableWindow=new ISPACES.ResizableWindow(this,options);
  this.resizableWindow=resizableWindow;
  this.windowDiv=resizableWindow.windowDiv; // set a reference to the windowDiv. @see drag()

  /*
  var titlebarWH=this.resizableWindow.titlebar.wh; // TBD - If we are not showing the location bar, do we need to create it.
  if(titlebarWH){
    ISPACES.log.debug(this.classId+'.ctor(): titlebarWH[0] = '+titlebarWH[0]+', titlebarWH[1] = '+titlebarWH[1]);
  }
  */
  resizableWindow.setTitlebarHeight(33);
  resizableWindow.titlebar.bo(0);
  //resizableWindow.titlebar.ba('transparent');

  /*
  this.apHeight=this.windowHeight-titlebarWH[1];
  ISPACES.log.debug(this.classId+'.ctor('+options+'): this.apHeight = '+this.apHeight);
  this.apHeight-=12; // TEMP - remove 8px for the window border.
  ISPACES.log.debug(this.classId+'.ctor('+options+'): this.apHeight = '+this.apHeight);
  */

  //this.apDiv=this.create.tagIdClass(Constants.Tags.DIV,this.id,this.objectId);
  this.apDiv=this.create.tagId(Constants.Tags.DIV,this.id);
  this.apDiv.name='this.apDiv';
  //this.apDiv.hi(this.apHeight);
  //this.apDiv.wihi(this.windowWidth,this.apHeight);
  //this.apDiv.wihi(windowWidth,windowHeight);
  //this.apDiv.bo('blue 2px solid');

  this.daysInWeek=this.DAYS_CHAR.length;

  this.populateYearMonthDay();
  //this.populateData();

  this.init();
};

ISPACES.Calendar.prototype=new ISPACES.Ap();
ISPACES.Calendar.prototype.constructor=ISPACES.Calendar;

Common.extend(ISPACES.Calendar.prototype,{

  classId:"Calendar"
  ,objectId:'calendar'
  ,title:'Calendar'
  /*String*/ ,ICON_IMG:Constants.Paths.IMAGES+'test/cal.gif'
  ///*Icon*/   ,icon:'data:image/gif;base64,R0lGODlhEAAQAKIGAEpNpaVNSqWmpUpNStbT1v///wAAAAAAACH5BAEAAAYALAAAAAAQABAAAANCaLrcJjDKOcS4uEoQasYTVBUFQZrlSY5pi6IVQQR0IN83G5C7uwq8oK8Qm9VwONZL1VIyl0QBcpoDDqHO6+rD/SQAADs='
  /*Array*/  ,MONTHS:['January','February','March','April','May','June','July','August','September','October','November','December']
  /*Array*/  ,MONTHS_ABBR:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  /*Array*/  ,DAYS:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  /*Array*/  ,DAYS_ABBR:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  /*Array*/  ,DAYS_CHAR:['S','M','T','W','T','F','S']
  /*Array*/  ,DAYS_IN_MONTH:[31,28,31,30,31,30,31,31,30,31,30,31]
  /*Date*/   ,now:new Date()
  /*int*/    ,heightDayHeader:28
  /*boolean*/ ,showingDay:false
  /*int*/    ,entryCount:0
  /*String*/ ,entryName:'entry'
  /*String*/ ,entryCountName:'entryCount'
  /*Array*/  ,entries:[]


  ,colorGreyout:'#0054F5' // #333, #000B80, #A6C6F6, #000
  ,opacityGreyout:'0.18' // 0.17, #000B80, F7F7F7
  //store:new Persist.Store(this.classId)
  //store:new Persist.Store('Calendar')
/*
  store:(function(){
    var store=new Persist.Store('Calendar');
    // build alert message
    var info = [
      'Backend: ',
      Persist.type || 'none',
      ', ',
      'Approximate Size Limit: ',
      (Persist.size < 0) ? 'unknown' : Persist.size
    ].join('');

    // prompt user with information
    alert(info);
    return store;
  }),
*/
/*
  store:function(){
    var store=new Persist.Store('Calendar');
    // build alert message
    var info = [
      'Backend: ',
      Persist.type || 'none',
      ', ',
      'Approximate Size Limit: ',
      (Persist.size < 0) ? 'unknown' : Persist.size
    ].join('');

    // prompt user with information
    alert(info);
    return store;
  },
*/

  ///*Date*/   curDate:this.now,

  ,init:function(){
    ISPACES.log.debug(this.classId+'.init()');
    //ISPACES.log.error(this.classId+'.init()');
    this.createAp(this.id);

    var divMain=this.divMain;
    var resizable=function(){};
    resizable.wi=function(w){divMain.wi(w)};
    resizable.hi=function(h){divMain.hi(h)};
    this.resizable=resizable;

    this.resizableWindow.addAp(); // Add the app to the window.

    //this.draggableAp=new ISPACES.DraggableAp(this);

    this.menuWH=Common.getWH(this.menu);
    if(this.menuWH){
      ISPACES.log.debug(this.classId+'.init(): this.menuWH[0] = '+this.menuWH[0]);
      ISPACES.log.debug(this.classId+'.init(): this.menuWH[1] = '+this.menuWH[1]);
    }

    //this.refresh();
    this.populateData();
    ISPACES.log.debug(this.classId+'.init(): this.id = '+this.id);

    //this.store.remove('calls');
    //this.store.get('calls',this.setDayWeekMonth,this); // get the button to select
    if(this.o.x)ISPACES.spaces.space.store.getThis(this);

    this.resizableWindow.visible();

    if(this.o.x)ISPACES.spaces.space.store.getThis(this);

    this.createMonthCalendar();
    this.refreshMonth();
  }

  ,createAp:function(id){
    ISPACES.log.debug(this.classId+'.createAp('+id+')');

    this.menu=this.createMenu();
    this.divMain=this.createMain();
    this.divMain.objectId=this.objectId;
    this.divMain.name="this.divMain";
    //this.apDiv.add(this.menu);

/*
    this.main=this.create.tag(Constants.Tags.DIV);
    this.main.add(this.menu);
    this.main.add(this.calDiv);
*/

    //this.calDiv=this.createCalendar();
    //this.apDiv.add(this.divMain);

    this.apDiv.addAll([this.menu,this.divMain]);

    //this.apDiv.wihi(this.windowWidth,this.windowHeight);

  }

  ,createMain:function(){
    ISPACES.log.debug(this.classId+'.createMain()');
    var main=this.create.tag(Constants.Tags.DIV);
    main.wihi(this.windowWidth,this.apHeight);
    main.miWi(222);
    //main.ow(Constants.Properties.AUTO);
    return main;
  }

  ,createMenu:function(){

    var _this=this; // Create a closure on this
    var cN='buttons';

    var buttonHeight=13;

    var ymdMargin='7px 0 0 2px';
    var calPrev='calprev';
    var calNext='calnext';
    var widthSelector=108;

    // year
    /*
    //var buttonYearPrev=ISPACES.ui.createDivButton(calPrev,function(){_this.setYear(_this.year-1);_this.divYear.replaceFirst(Common.Create.txt(_this.year))});
    var buttonYearPrev=ISPACES.ui.createDivButton(calPrev,function(){_this.prevYear()});
    var divYearPrev=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divYearPrev.alM();
    divYearPrev.add(buttonYearPrev);
    */
    var buttonPaddingMWD='6px 13px 6px 13px';

    //var buttonYearPrev=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.start()},null,null,'0',buttonPaddingMWD);
    //var buttonYearPrev=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.start()},null,null,'0','6px 13px 6px 13px');
    //var buttonYearPrev=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.start()},25,18,'0','0');
    //var buttonYearPrev=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.start()},15,22,'0',null);
    //var buttonYearPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevYear()},15,21,'0','7px 4px 0px 4px');
    var buttonYearPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevYear()},22,22,'0','4px 2px 2px 2px');

    //var imgPrev=cImg(DIR_ICON+'window/left-next.gif',15);
    //var imgPrev=cImg(DIR_IMAGES+'arrow/dev/arrow-button-blue.gif',15);
    //var imgPrev=cImg(DIR_IMAGES+'arrow/next-white-trans-7x12.gif',15);
    //var imgPrev=cImg(DIR_IMAGES+'arrow/dev/Right_Blue_Arrow_clip_art_s.gif',15);
    //buttonYearPrev.add(imgPrev);
    //buttonYearPrev.alCM();
    //buttonYearPrev.add(Common.Create.txt('Today'));
    var divYearPrev=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divYearPrev.wip(1);
    //divYearPrev.alB();
    divYearPrev.add(buttonYearPrev);
    //divYearPrev.alB();

    /*
    this.divYear=this.create.tag(Constants.Tags.DIV);
    this.divYear.wi(33);
    this.divYear.fW(Constants.Properties.BOLD);
    this.divYear.ma(ymdMargin);
    this.divYear.add(Common.Create.txt(this.year));
    */

    this.divYear=this.create.divCell(this.create.divRow([Common.Create.txt(this.year)]));
    //this.divYear.wi(33);
    this.divYear.fW(Constants.Properties.BOLD);
    this.divYear.pa('0 8px 0 8px ');
    //this.divYear.ma(ymdMargin);
    this.divYear.setClass('blankoff');
    //this.divYear.alCM();
    //this.divYear.alL();
    //this.divYear.ma('auto auto auto 0px');
    this.divYear.alLM();
    //this.divYear.alCM();

    /*
    //var buttonYearNext=ISPACES.ui.createDivButton(calNext,function(){_this.setYear(_this.year+1);_this.divYear.replaceFirst(Common.Create.txt(_this.year))});
    var buttonYearNext=ISPACES.ui.createDivButton(calNext,function(){_this.nextYear()});
    var divYearNext=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divYearNext.add(buttonYearNext);
    divYearNext.alM();
    */

    var buttonYearNext=ISPACES.ui.createAButton('topmenu-right',function(){_this.nextYear()},22,22,'0','4px 2px 2px 2px');
    //var buttonYearNext=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.nextYear()},24,null,'0','4px');
    //var imgNext=cImg(DIR_IMAGES+'arrow/next-6B6D6B.gif',15);
    //var imgNext=cImg(DIR_IMAGES+'arrow/right-next.gif',15);
    //var imgNext=cImg(DIR_IMAGES+'arrow/dev/arrow-button-blue-right.gif',20);
    //var imgNext=cImg(DIR_IMAGES+'arrow/dev/arrow-button-blue-right-30x.gif',20);
    //var imgNext=cImg(DIR_IMAGES+'arrow/dev/Untitled-5.gif',30);
    //var imgNext=cImg(DIR_IMAGES+'arrow/dev/right-on.gif',20);
    //buttonYearNext.add(imgNext);
    var divYearNext=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divYearNext.wip(1);
    //divYearNext.alB();
    divYearNext.add(buttonYearNext);
    //divYearNext.alB();

    var yearDivRow=this.create.divRow([divYearPrev,this.divYear,divYearNext]);
    //var yearDivRow=this.create.divRow([divYearPrev,divYearNext]);
    var yearDiv=this.create.divCell(yearDivRow);

    // month
    /*
    //var buttonMonthPrev=ISPACES.ui.createDivButton(calPrev,function(){_this.setMonth(_this.month-1);_this.divMonth.replaceFirst(Common.Create.txt(_this.getMnth(_this.month)))});
    var buttonMonthPrev=ISPACES.ui.createDivButton(calPrev,function(){_this.prevMonth()});
    var divMonthPrev=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divMonthPrev.alM();
    divMonthPrev.add(buttonMonthPrev);
    */
    //var buttonMonthPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevMonth()},15,21,'0','7px 4px 0px 4px');
    var buttonMonthPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevMonth()},22,22,'0','4px 2px 2px 2px');
    //var imgPrev=cImg(DIR_IMAGES+'arrow/left-next.gif',15);
    //buttonMonthPrev.add(imgPrev);
    var divMonthPrev=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divMonthPrev.wip(1);
    //divMonthPrev.alB();
    divMonthPrev.add(buttonMonthPrev);

    ///*
    this.divMonth=this.create.tag(Constants.Tags.DIV);
    this.divMonth.wi(widthSelector);
    this.divMonth.fW(Constants.Properties.BOLD);
    //this.divMonth.ma(ymdMargin);
    this.divMonth.add(Common.Create.txt(this.getMnth()));
    //*/
    var cellMonth=this.create.divCell(this.create.divRow([this.divMonth]));
    cellMonth.wi(widthSelector);
    cellMonth.fW(Constants.Properties.BOLD);
    cellMonth.pa('0 8px 0 8px ');
    cellMonth.alLM();

    cellMonth.setClass('blankoff');

    /*
    var buttonMonthNext=ISPACES.ui.createDivButton(calNext,function(){_this.setMonth(_this.month+1);_this.divMonth.replaceFirst(Common.Create.txt(_this.getMnth(_this.month)))});
    var buttonMonthNext=ISPACES.ui.createDivButton(calNext,function(){_this.nextMonth()});
    var divMonthNext=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divMonthNext.alM();
    divMonthNext.add(buttonMonthNext);
    */
    //var buttonMonthNext=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.nextMonth()},15,21,'0','7px 4px 0px 4px');
    //var buttonMonthNext=ISPACES.ui.createAButton('topmenu-right',function(){_this.nextMonth()},24,22,'0','4px 4px 2px 4px');
    var buttonMonthNext=ISPACES.ui.createAButton('topmenu-right',function(){_this.nextMonth()},22,22,'0','4px 2px 2px 2px');
    //var imgNext=cImg(DIR_IMAGES+'arrow/right-next.gif',15);
    //var imgNext=cImg(DIR_IMAGES+'arrow/dev/arrow-black-rounded-on-blue.gif',20);
    //buttonMonthNext.add(imgNext);
    var divMonthNext=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divMonthNext.wip(1);
    //divMonthNext.alB();
    divMonthNext.add(buttonMonthNext);


    //var monthDivRow=this.create.divRow([divMonthPrev,this.divMonth,divMonthNext]);
    var monthDivRow=this.create.divRow([divMonthPrev,cellMonth,divMonthNext]);
    this.monthSelector=this.create.divCell(monthDivRow);

    // week
    /*
    var buttonWeekPrev=ISPACES.ui.createDivButton(calPrev,function(){_this.prevWeek()});
    var divWeekPrev=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divWeekPrev.alM();
    divWeekPrev.add(buttonWeekPrev);
    */
    //var buttonWeekPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevWeek()},15,21,'0','7px 4px 0px 4px');
    var buttonWeekPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevWeek()},22,22,'0','4px 2px 2px 2px');
    //var imgPrev=cImg(DIR_IMAGES+'arrow/left-next.gif',15);
    //buttonWeekPrev.add(imgPrev);
    var divWeekPrev=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divWeekPrev.wip(1);
    //divWeekPrev.alB(1);
    divWeekPrev.add(buttonWeekPrev);

    this.divWeek=this.create.tag(Constants.Tags.DIV);
    this.divWeek.wi(widthSelector);
    this.divWeek.fW(Constants.Properties.BOLD);
    //this.divWeek.ma(ymdMargin);
    //this.divWeek.nowrap();
    this.divWeek.add(Common.Create.txt(this.getWeek()));
    var cellWeek=this.create.divCell(this.create.divRow([this.divWeek]));
    cellWeek.wi(widthSelector);
    cellWeek.fW(Constants.Properties.BOLD);
    cellWeek.pa('0 8px 0 8px ');
    //cellWeek.ma(ymdMargin);
    //cellWeek.alCM();
    //cellWeek.alL();
    //cellWeek.ma('auto auto auto 0px');
    cellWeek.alLM();
    cellWeek.setClass('blankoff');

    /*
    var buttonWeekNext=ISPACES.ui.createDivButton(calNext,function(){_this.nextWeek()});
    var divWeekNext=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divWeekNext.alM();
    divWeekNext.add(buttonWeekNext);
    */
    //var buttonWeekNext=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.nextWeek()},15,21,'0','7px 4px 0px 4px');
    var buttonWeekNext=ISPACES.ui.createAButton('topmenu-right',function(){_this.nextWeek()},22,22,'0','4px 2px 2px 2px');
    //var imgNext=cImg(DIR_IMAGES+'arrow/right-next.gif',15);
    //buttonWeekNext.add(imgNext);
    var divWeekNext=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divWeekNext.wip(1);
    //divWeekNext.alB(1);
    divWeekNext.add(buttonWeekNext);

    var weekDivRow=this.create.divRow([divWeekPrev,cellWeek,divWeekNext]);
    this.weekSelector=this.create.divCell(weekDivRow);
    this.weekSelector.hide();

    // day
    /*
    var buttonDayPrev=ISPACES.ui.createDivButton(calPrev,function(){_this.prevDay();_this.divDay.replaceFirst(Common.Create.txt(_this.getDayTh(_this.getDayOfWeek(),_this.dayOfMonth)))});
    var divDayPrev=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divDayPrev.alM();
    divDayPrev.add(buttonDayPrev);
    */
    //var buttonDayPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevDay();_this.divDay.replaceFirst(Common.Create.txt(_this.getDayTh(_this.getDayOfWeek(),_this.dayOfMonth)))},15,21,'0','7px 4px 0px 4px');
    var buttonDayPrev=ISPACES.ui.createAButton('topmenu-left',function(){_this.prevDay();_this.divDay.replaceFirst(Common.Create.txt(_this.getDayTh(_this.getDayOfWeek(),_this.dayOfMonth)))},22,22,'0','4px 2px 2px 2px');
    //var imgPrev=cImg(DIR_IMAGES+'arrow/left-next.gif',15);
    //buttonDayPrev.add(imgPrev);
    var divDayPrev=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divDayPrev.wip(1);
    divDayPrev.alB();
    divDayPrev.add(buttonDayPrev);

    this.divDay=this.create.tag(Constants.Tags.DIV);
    this.divDay.wi(widthSelector);
    this.divDay.fW(Constants.Properties.BOLD);
    this.divDay.ma(ymdMargin);
    this.divDay.add(Common.Create.txt(Constants.Characters.NBSP));
    this.divDay.setClass('blank');

    /*
    var buttonDayNext=ISPACES.ui.createDivButton(calNext,function(){_this.nextDay();_this.divDay.replaceFirst(Common.Create.txt(_this.getDayTh(_this.getDayOfWeek(),_this.dayOfMonth)))});
    var divDayNext=ISPACES.ui.createDivCell(cN,null,buttonHeight,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divDayNext.alM();
    divDayNext.add(buttonDayNext);
    */
    //var buttonDayNext=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.nextDay();_this.divDay.replaceFirst(Common.Create.txt(_this.getDayTh(_this.getDayOfWeek(),_this.dayOfMonth)))},15,21,'0','7px 4px 0px 4px');
    var buttonDayNext=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.nextDay();_this.divDay.replaceFirst(Common.Create.txt(_this.getDayTh(_this.getDayOfWeek(),_this.dayOfMonth)))},22,22,'0','4px 2px 2px 2px');
    var imgNext=ISPACES.ui.createImage(Constants.Paths.IMAGES+'arrow/right-next.gif',15);
    buttonDayNext.add(imgNext);
    var divDayNext=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divDayNext.wip(1);
    divDayNext.alB();
    divDayNext.add(buttonDayNext);

    var dayDivRow=this.create.divRow([divDayPrev,this.divDay,divDayNext]);
    this.daySelector=this.create.divCell(dayDivRow);

    /*
    //var buttonToday=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-eee',function(){_this.today()},null,null,Constants.Characters.ZERO,'1px 13px 1px 13px');
    var buttonToday=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-hover',function(){_this.today()},null,null,Constants.Characters.ZERO,'1px 13px 1px 13px');
    buttonToday.add(Common.Create.txt(TODAY));
    var divToday=ISPACES.ui.createDivCell(cN,null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divToday.add(buttonToday);
    divToday.alB();
    divToday.paL(PX8);
    divToday.paB(Constants.Strings.PX3);
    */

    var buttonPaddingMWD='6px 13px 6px 13px';

    var buttonToday=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.start()},null,null,'0',buttonPaddingMWD);
    //buttonToday.add(imgOn);
    buttonToday.add(Common.Create.txt('Today'));
    var divToday=ISPACES.ui.createDivCell('buttons',null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divToday.wip(1);
    //divToday.alB();
    //divToday.alL();
    divToday.alT();
    divToday.add(buttonToday);


    //var menuRow=this.create.divRow([dayDiv,this.weekSelector,this.monthSelector,yearDiv,divToday]);
    var menuRow=this.create.divRow([this.daySelector,this.weekSelector,this.monthSelector,yearDiv,divToday]);
    var menuRowCell=this.create.divCell(menuRow);

    menuRowCell.wip(1);
    menuRowCell.nowrap();

    var blankDiv=this.create.divCell();
    blankDiv.wihi(1);
    var blankRow=this.create.divRow([blankDiv]);
    var blankTable=this.create.divCell(blankRow);
    blankTable.setClass('blank');
    blankTable.alT();

    //var buttonMonth=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop',function(){_this.showMonth()},null,null,Constants.Characters.ZERO,buttonPaddingMWD);
    this.buttonMonth=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.showMonth()},null,null,Constants.Characters.ZERO,buttonPaddingMWD);
    //buttonMonth.add(Common.Create.txt(MONTH));
    this.buttonMonth.add(Common.Create.txt(MONTH));
    var divMonth=ISPACES.ui.createDivCell(cN,null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divMonth.wip(1);
    //divMonth.add(buttonMonth);
    divMonth.add(this.buttonMonth);

    //var buttonWeek=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop',function(){_this.showWeek()},null,null,'0',buttonPaddingMWD);
    this.buttonWeek=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.showWeek()},null,null,'0',buttonPaddingMWD);
    //buttonWeek.add(Common.Create.txt(WEEK));
    this.buttonWeek.add(Common.Create.txt(WEEK));
    var divWeek=ISPACES.ui.createDivCell(cN,null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divWeek.wip(1);
    //divWeek.add(buttonWeek);
    divWeek.add(this.buttonWeek);

    //var buttonDay=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop',function(){_this.showDay()},null,null,'0',buttonPaddingMWD);
    this.buttonDay=ISPACES.ui.createAButton(Constants.Strings.POSITIVE+'-notop-on',function(){_this.showDay()},null,null,'0',buttonPaddingMWD);
    //buttonDay.add(Common.Create.txt(DAY));
    this.buttonDay.add(Common.Create.txt(DAY));
    var divDay=ISPACES.ui.createDivCell(cN,null,null,Constants.Characters.ZERO,Constants.Characters.ZERO);
    divDay.wip(1);
    //divDay.add(buttonDay);
    divDay.add(this.buttonDay);

    var dayWeekMonthRow=this.create.divRow([divMonth,divWeek,divDay]);
    var dayWeekMonth=this.create.divCell(dayWeekMonthRow);
    dayWeekMonth.wip(1);
    dayWeekMonth.alR();
    dayWeekMonth.alT();
    //dayWeekMonth.boL('#ccc 1px solid');

    //var menuDivTable=this.create.divTable([menuRowCell,dayWeekMonth]);
    var menuDivTable=this.create.divTable([menuRowCell,blankTable,dayWeekMonth]);
    //menuDivTable.id=id;
    menuDivTable.wip(100);
    menuDivTable.boB('#A0A0A0 1px solid');

    var menu=this.create.tagClass(Constants.Tags.DIV,'menu');
    menu.ow(Constants.Properties.HIDDEN);
    menu.add(menuDivTable);

    //_this=null; // Dereference the closure so that it can be garbage collected.

    return menu;

  }

  ,populateData:function(){
    ISPACES.log.debug(this.classId+'.populateData()');
    this.checkLocalStorage(this.entriesName);
    //this.showEntries();
    //this.removeEntries();
  }

  ,populateYearMonthDay:function(date){
    ISPACES.log.debug(this.classId+'.populateYearMonthDay('+date+')');

    this.year=(date||this.now).getFullYear();
    this.month=(date||this.now).getMonth();
    this.weekday=(date||this.now).getDay();
    this.date=(date||this.now).getDate();
    /*
    ISPACES.log.debug(this.classId+'.populateYearMonthDay(date): this.year = '+this.year);
    ISPACES.log.debug(this.classId+'.populateYearMonthDay(date): this.month = '+this.month);
    ISPACES.log.debug(this.classId+'.populateYearMonthDay(date): this.weekday = '+this.weekday);
    ISPACES.log.debug(this.classId+'.populateYearMonthDay(date): this.date = '+this.date);
    */
    this.dateSelected=this.date;
    this.monthSelected=this.month;

  }

  ,checkRemoteStorage:function(id){
    ISPACES.log.debug(this.classId+'.checkRemoteStorage('+id+')');
  }

  ,checkLocalStorage:function(id){
    ISPACES.log.debug(this.classId+'.checkLocalStorage('+id+')');
    /*
    var _this=this;
    //this.store.get(id,function(ok, val) {
    this.store.get(id,function(ok,val){
      if(ok&&val){
        ISPACES.log.alert(_this.classId+'.checkLocalStorage('+id+'): val = ' + val);
        this.entries=val;
        ISPACES.log.alert(_this.classId+'.checkLocalStorage('+id+'): this.entries = ' + this.entries);
      }
    },this);
    */
    //this.store.get(id,this.setEntries,this);
  }

  ,setDayWeekMonth:function(ok,val){
    ISPACES.log.alert(this.classId+'.setDayWeekMonth('+ok+','+val+')');
    if(ok&&val){
      ISPACES.log.debug(this.classId+'.setDayWeekMonth('+ok+','+val+'): val = ' + val);
      ISPACES.log.debug(this.classId+'.setDayWeekMonth('+ok+','+val+'): typeof val = ' + typeof val);
      ISPACES.log.debug(this.classId+'.setDayWeekMonth('+ok+','+val+'): Common.parens(val) = ' + Common.parens(val));
      //this.dayWeekMonth=eval(Common.parens(val));
      eval(Common.parens(val));
      /*
      if(val=='month'){
        ISPACES.log.alert(this.classId+'.setDayWeekMonth('+ok+','+val+'): this.showMonth()');
        this.showMonth();
      }else if(val=='week'){
        ISPACES.log.alert(this.classId+'.setDayWeekMonth('+ok+','+val+'): this.showWeek()');
        this.showWeek();
      }
      */
    }else{
      ISPACES.log.debug(this.classId+'.setDayWeekMonth('+ok+','+val+'): No '+this.classId+' dayWeekMonth entry found.');
      this.showMonth();
    }
  }

  ,setEntries:function(ok,val){
    ISPACES.log.alert(this.classId+'.setEntries('+ok+','+val+')');
    if(ok&&val){
      ISPACES.log.debug(this.classId+'.setEntries('+ok+','+val+'): val = ' + val);
      ISPACES.log.debug(this.classId+'.setEntries('+ok+','+val+'): typeof val = ' + typeof val);
      //this.entries=val;
      this.entries=eval(Common.parens(val));
      ISPACES.log.debug(this.classId+'.setEntries('+ok+','+val+'): this.entries = ' + this.entries);
      ISPACES.log.debug(this.classId+'.setEntries('+ok+','+val+'): typeof this.entries = ' + typeof this.entries);
      ISPACES.log.debug(this.classId+'.setEntries('+ok+','+val+'): this.entries.length = ' + this.entries.length);
    }else{
      ISPACES.log.debug(this.classId+'.setEntries('+ok+','+val+'): No '+this.classId+' entries found.');
    }
  }

  ,nextYear:function(){
    //ISPACES.log.alert(this.classId+'.nextYear()');
    this.setYear(this.year+1);
    this.refreshMonth();
  }

  ,prevYear:function(){
    //ISPACES.log.alert(this.classId+'.prevYear()');
    this.setYear(this.year-1);
    this.refreshMonth();
  }

  ,setYear:function(year){
    //ISPACES.log.alert(this.classId+'.setYear('+year+')');
    this.year=year;
    this.divYear.replaceFirst(Common.Create.txt(this.year));
  }

  ,prevMonth:function(){
    //ISPACES.log.alert(this.classId+'.prevMonth()');
    this.setMonth(this.month-1);
    this.divMonth.replaceFirst(Common.Create.txt(this.getMnth(this.month)))
  }

  ,nextMonth:function(){
    //ISPACES.log.alert(this.classId+'.nextMonth()');
    this.setMonth(this.month+1);
    this.divMonth.replaceFirst(Common.Create.txt(this.getMnth(this.month)))
  }

  ,setMonth:function(month){
    //ISPACES.log.alert(this.classId+'.setMonth('+month+')');
    if(month<0){
      month=11;
      this.year--;
      this.divYear.replaceFirst(Common.Create.txt(this.year));
    }else if(month>11){
      month=0;
      this.year++;
      this.divYear.replaceFirst(Common.Create.txt(this.year));
    }
    this.month=month;

    this.divMonth.replaceFirst(Common.Create.txt(this.getMnth(this.month)));
    this.refreshMonth();

  }

  ,getMnth:function(month){return this.MONTHS[(month?month:this.month)]}

  ,getMnthPrev:function(month){
    if(month==0){
      return 11;
    }
    return month;
  }

  ,setDayOfMonth:function(dayOfMonth){
    this.dayOfMonth=dayOfMonth;
  }

  ,prevWeek:function(){
    ISPACES.log.alert(this.classId+'.prevWeek()');

    var daysInMonth=this.getDaysInMonth();
    ISPACES.log.debug(this.classId+'.prevWeek(): daysInMonth = '+daysInMonth);

    if(!this.weekStartDate){
      this.weekStartDate=this.getWeekStartDate();
    }

    this.weekStartDate-=this.daysInWeek;
    ISPACES.log.debug(this.classId+'.prevWeek(): this.weekStartDate = '+this.weekStartDate);

    if(this.weekStartDate<=0){
      this.setMonth(this.month-1);
      daysInMonth=this.getDaysInMonth();
      this.weekStartDate=(this.weekStartDate+daysInMonth); // add the zero count
      ISPACES.log.debug(this.classId+'.prevWeek(): this.weekStartDate = '+this.weekStartDate);
      this.divMonth.replaceFirst(Common.Create.txt(this.getMnth()))
    }
    this.divWeek.replaceFirst(Common.Create.txt(this.getWeek(this.month,this.weekStartDate)));
  }

  ,nextWeek:function(){
    ISPACES.log.alert(this.classId+'.nextWeek()');

    //ISPACES.log.debug(this.classId+'.nextWeek(): this.dayOfMonth = '+this.dayOfMonth);
    //ISPACES.log.debug(this.classId+'.nextWeek(): this.date = '+this.date);

    var daysInMonth=this.getDaysInMonth();
    ISPACES.log.debug(this.classId+'.nextWeek(): daysInMonth = '+daysInMonth);

    if(!this.weekStartDate){
      this.weekStartDate=this.getWeekStartDate();
    }

    /*
    this.date+=this.daysInWeek;
    ISPACES.log.debug(this.classId+'.nextWeek(): this.date = '+this.date);
    */
    this.weekStartDate+=this.daysInWeek;
    ISPACES.log.debug(this.classId+'.nextWeek(): this.weekStartDate = '+this.weekStartDate);

    //if(this.date>daysInMonth){
    if(this.weekStartDate>daysInMonth){

      /*
      this.date=this.date-daysInMonth;
      ISPACES.log.debug(this.classId+'.nextWeek(): this.date = '+this.date);
      */
      this.weekStartDate=this.weekStartDate-daysInMonth;
      ISPACES.log.debug(this.classId+'.nextWeek(): this.weekStartDate = '+this.weekStartDate);

      this.setMonth(this.month+1);
      //this.divMonth.replaceFirst(Common.Create.txt(this.getMnth(this.month)))
      this.divMonth.replaceFirst(Common.Create.txt(this.getMnth()))
    }
    //this.divWeek.replaceFirst(Common.Create.txt(this.getWeek(null,this.weekStartDate)));
    this.divWeek.replaceFirst(Common.Create.txt(this.getWeek(this.month,this.weekStartDate)));

    this.refreshWeek(this.weekStartDate);

  }

  ,getWeekStartDate:function(){
    ISPACES.log.debug(this.classId+'.getWeekStartDate()');
    ISPACES.log.debug(this.classId+'.getWeekStartDate(): this.date = '+this.date);
    ISPACES.log.debug(this.classId+'.getWeekStartDate(): this.weekday = '+this.weekday);
    var weekStartDate=this.date-this.weekday;
    if(weekStartDate<=0){
      //this.setMonth(this.month-1);
      //var daysInMonthPrev=this.getDaysInMonth();
      var daysInMonthPrev=this.getDaysInMonth(this.month-1);
      weekStartDate=daysInMonthPrev+weekStartDate;
    }
    return weekStartDate;
  }

  //getWeek:function(month){
  ,getWeek:function(month,weekStartDate){
    ISPACES.log.debug(this.classId+'.getWeek()');
    var sb=new ISPACES.StringBuilder();
    //var month=this.MONTHS[(month?month:this.month)];
    var monthAbbr=this.MONTHS_ABBR[(month?month:this.month)];
    var daysInMonth=this.getDaysInMonth();
    sb.append(monthAbbr);
    sb.append(Constants.Characters.SPACE);

    if(!weekStartDate){
      ISPACES.log.debug(this.classId+'.getWeek(): this.weekday = '+this.weekday);
      weekStartDate=this.getWeekStartDate();
    }
    /*
    var weekStartDate=this.date-this.weekday;
    if(weekStartDate<=0){
      this.setMonth(this.month-1);
      var daysInMonthPrev=this.getDaysInMonth();
      weekStartDate=daysInMonthPrev+weekStartDate;
    }
    */

    ISPACES.log.debug(this.classId+'.getWeek(): weekStartDate = '+weekStartDate);
    sb.append(weekStartDate);
    sb.append(' - ');
    //sb.append(Constants.Characters.SPACE);sb.append(hyphen);sb.append(Constants.Characters.SPACE);
    //sb.append(Constants.Characters.SPACE);sb.append(urlhyphen);sb.append(Constants.Characters.SPACE);

    var weekEndDate=weekStartDate+(this.daysInWeek-1);
    if(weekEndDate>daysInMonth){
      weekEndDate=weekEndDate-daysInMonth;
      var monthNextAbbr=this.MONTHS_ABBR[(month?month+1:this.month+1)];
      ISPACES.log.debug(this.classId+'.getWeek(): monthNextAbbr = '+monthNextAbbr);
      sb.append(monthNextAbbr);
      sb.append(Constants.Characters.SPACE);
    }
    ISPACES.log.debug(this.classId+'.getWeek(): weekEndDate = '+weekEndDate);

    sb.append(weekEndDate);
    ISPACES.log.debug(this.classId+'.getWeek(): sb.asString() = '+sb.asString());
    return sb.asString();
  }

  ,nextDay:function(){
    ISPACES.log.alert(this.classId+'.nextDay()');
    this.dayOfMonth++;
    var daysInMonth=this.getDaysInMonth();
    if(this.dayOfMonth>daysInMonth){
      this.dayOfMonth=1;
      this.setMonth(this.month+1);
      this.divMonth.replaceFirst(Common.Create.txt(this.getMnth(this.month)))
    }
    ISPACES.log.debug(this.classId+'.nextDay(): this.dayOfMonth = '+this.dayOfMonth);
    var dayOfWeek=this.getDayOfWeek(daysInMonth);
    ISPACES.log.debug(this.classId+'.nextDay(): dayOfWeek = '+dayOfWeek);
  }

  ,prevDay:function(){
    ISPACES.log.alert(this.classId+'.prevDay()');
    this.dayOfMonth--;
    if(this.dayOfMonth==0){
      this.setMonth(this.month-1);
      var daysInMonth=this.getDaysInMonth();
      this.dayOfMonth=daysInMonth;
      this.divMonth.replaceFirst(Common.Create.txt(this.getMnth(this.month)))
    }
    ISPACES.log.debug(this.classId+'.nextDay(): this.dayOfMonth = '+this.dayOfMonth);
    var dayOfWeek=this.getDayOfWeek(daysInMonth);
    ISPACES.log.debug(this.classId+'.nextDay(): dayOfWeek = '+dayOfWeek);
  }

  ,getDayOfWeek:function(daysInMonth){
    ISPACES.log.debug(this.classId+'.getDayOfWeek()');
    if(!daysInMonth)daysInMonth=this.getDaysInMonth();
    var dayOfMonthCount=0;
    var cols=this.daysInWeek;
    var daysCount=0;
    var rows=1;
    var daysInRowOne=this.daysInWeek-this.monthWeekday;
    ISPACES.log.debug(this.classId+'.getDayOfWeek(): daysInRowOne = '+daysInRowOne);
    daysCount+=daysInRowOne;
    ISPACES.log.debug(this.classId+'.getDayOfWeek(): daysCount = '+daysCount);
    while(daysCount<daysInMonth){
      daysCount+=this.daysInWeek;
      ISPACES.log.debug(this.classId+'.getDayOfWeek(): daysCount = '+daysCount);
      rows++;
      ISPACES.log.debug(this.classId+'.v(): rows = '+rows);
    }
    ISPACES.log.debug(this.classId+'.getDayOfWeek(): rows = '+rows);

    for(var i=0;i<rows;i++){
      for(var j=0;j<cols;j++){
        if(
          i==0&&j>=this.monthWeekday  // if it is the first row and j is greater than the day this month starts on
          ||(i>0&&dayOfMonthCount<daysInMonth) // if it is any other row
        ){
          dayOfMonthCount++;
          if(dayOfMonthCount==this.dayOfMonth){
            return this.DAYS[j];
          }
        }
      }
    }
    return Constants.Characters.EMPTY;
  }

  ,today:function(){
    ISPACES.log.alert(this.classId+'.today()');
    this.populateYearMonthDay(new Date());
    //this.setDay(this.day);
    this.setMonth(this.month);
    this.setYear(this.year);
    //this.store.get('calls',this.setDayWeekMonth,this); // get the button to select
  }

  ,setDay:function(day){
    ISPACES.log.alert(this.classId+'.setDay('+day+')');
    this.dayOfMonth=day;
    var month=0;
    if(month<0){
      month=11;
      this.year--;
      this.divYear.replaceFirst(Common.Create.txt(this.year));
    }else if(month>11){
      month=0;
      this.year++;
      this.divYear.replaceFirst(Common.Create.txt(this.year));
    }
    this.month=month

    this.refreshMonth();

  }
/*
  nextDay:function(){
    ISPACES.log.debug(this.classId+'.nextDay()');
    this.dayOfMonth++;
    var daysInMonth=this.getDaysInMonth();
    if(this.dayOfMonth>daysInMonth){
      this.dayOfMonth=1;
      this.setMonth(this.month+1);
      this.divMonth.replaceFirst(Common.Create.txt(this.getMnth(this.month)))
    }
    ISPACES.log.debug(this.classId+'.nextDay(): this.dayOfMonth = '+this.dayOfMonth);
    var dayOfWeek=this.getDayOfWeek(daysInMonth);
    ISPACES.log.debug(this.classId+'.nextDay(): dayOfWeek = '+dayOfWeek);
  },
*/
  ,getNextHour:function(hour){
    if(hour==12){
      hour=0;
    }
    hour++;
    return hour;
  }

  ,showMonth:function(){
    //ISPACES.log.alert(this.classId+'.showMonth()');
    if(!this.monthTable){
      this.createMonthCalendar();
    }
    //this.store.set('calls',"this.showMonth()");
    //this.store.set('calls','month');
    this.weekSelector.hide();
    this.daySelector.hide();
    this.monthSelector.show();
    if(this.weekDiv)this.weekDiv.hide();
    this.monthDiv.show();
    this.buttonMonth.setClass('positive-notop');
    this.buttonWeek.setClass('positive-notop-on');
    this.buttonDay.setClass('positive-notop-on');
    this.refreshMonth();
  }

  ,showWeek:function(){
    //ISPACES.log.alert(this.classId+'.showWeek()');
    //this.store.set('calls',"this.showWeek()");
    //this.store.set('calls','week');

/*
    if(!this.showingDay){ // if we click the week button a second time, show the day
      this.showDay();
      return;
    }
*/

    if(!this.weekHeaderTable){
      this.createWeekCalendar();
    }

    if(this.monthDiv)this.monthDiv.hide();
    this.monthSelector.hide();
    this.daySelector.hide();
    this.weekSelector.show();
    this.buttonMonth.setClass('positive-notop-on');
    this.buttonDay.setClass('positive-notop-on');
    this.buttonWeek.setClass('positive-notop');

    if(this.showingDay){
      var cols=this.weekHeaderTds.length;
      for(var i=0;i<cols;i++){
        this.weekHeaderTds[i].show();
      }
      var weekTdCols=this.weekTds.length;
      ISPACES.log.debug(this.classId+'.showWeek(): weekTdCols = '+weekTdCols);
      for(var i=0;i<weekTdCols;i++){
        this.weekTds[i].show();
      }
      this.showingDay=false;
    }

    this.weekDiv.show();

  }

  ,showDay:function(){
    ISPACES.log.alert(this.classId+'.showDay()');

    if(this.monthDiv)this.monthDiv.hide();

    ISPACES.log.debug(this.classId+'.showDay(): this.showingDay = '+this.showingDay);

/*
    if(this.showingDay){ // if we click the week button a second time, show the day
      this.showWeek();
      return;
    }

    if(!this.weekDiv){ // if the week has never been shown
      this.showWeek();
    }else{
      this.weekDiv.show();
    }
    if(this.showingDay||!this.weekDiv){ // if we click the week button a second time, show the day
      this.showWeek();
      if(this.showingDay){
        return;
      }
    }else{
      this.weekDiv.show();
    }
*/

    this.monthSelector.hide();
    this.weekSelector.hide();
    this.daySelector.show();
    this.buttonMonth.setClass('positive-notop-on');
    this.buttonWeek.setClass('positive-notop-on');
    this.buttonDay.setClass('positive-notop');


/*
    var cols=this.daysInWeek;
    for(var i=0;i<cols;i++){
      if(i!=4){
        $('weekHeader'+i).hide();
      }
    }
*/
    var cols=this.weekHeaderTds.length;
    for(var i=0;i<cols;i++){
      this.weekHeaderTds[i].hide();
    }

/*
    var weekTrCols=this.weekTrs.length;
    for(var i=0;i<weekTrCols;i++){
      alert('this.weekTrs['+i+'].hide()');
      this.weekTrs[i].hide();
    }
*/

/*
    var weekCols=this.weekColgroups.length;
    alert('weekCols = '+weekCols);
    for(var i=0;i<weekCols;i++){
      alert('this.weekColgroups.['+i+'].hide()');
      this.weekColgroups[i].hide();
    }
*/

///*
    var weekTdCols=this.weekTds.length;
    ISPACES.log.debug(this.classId+'.showDay(): weekTdCols = '+weekTdCols);
    for(var i=0;i<weekTdCols;i++){
      this.weekTds[i].hide();
    }
//*/
    this.showingDay=true;
  }

  ,createMonthCalendar:function(){
    ISPACES.log.debug(this.classId+'.createMonthCalendar()');

    this.monthDiv=this.create.tag(Constants.Tags.DIV);
    this.monthDiv.hip(100);

    this.monthTable=Common.Create.table(null,1);
    this.monthTable.ba('#ccc');
    this.monthTable.wiphip(100);
    this.monthTable.setClass('month');

    //this.monthTable.style.emptyCells='show';

    var tHead=this.create.tag(Constants.Tags.THEAD);
    //tHead.hi(33);
    //tHead.bo(Constants.Characters.ZERO);

    var tableHeight=7;
    var tr=this.create.tag(Constants.Tags.TR);
    for(var i=0;i<this.daysInWeek;i++){
      var th=this.create.tag(Constants.Tags.TH);
      th.alCM();
      /*
      th.co('#6c6c6c');
      th.ba(this.colorHeader);
      th.fW(Constants.Properties.BOLD);
      th.fZ(14);
      */
      th.wip(100/this.daysInWeek);
      //th.bo(Constants.Borders.BORE);
      //th.hip(100/tableHeight);
      th.hi(this.heightDayHeader);
      th.add(Common.Create.txt(this.DAYS_ABBR[i]));
      tr.add(th);
    }
    //tHead.hip(100/tableHeight);
    tHead.add(tr);
    this.monthTable.add(tHead);

    //this.main.add(this.monthTable);
    this.monthDiv.add(this.monthTable);
    this.divMain.add(this.monthDiv);

  }

  ,createWeekCalendar:function(){
    ISPACES.log.debug(this.classId+'.createWeekCalendar()');

    this.now=new Date();
    this.populateYearMonthDay();

    this.weekDiv=this.create.tag(Constants.Tags.DIV);

    this.weekHeaderTable=Common.Create.table(null,1);
    this.weekHeaderTable.setClass('weekHeader');

    var mainWH=Common.getWH(this.divMain);
    var totalWidth=mainWH[0]-16-40;
    this.headerWidth=Math.floor((totalWidth/this.daysInWeek));
    this.headerWidthMiWi=this.headerWidth-33;

    ISPACES.log.debug(this.classId+'.createWeekCalendar(): mainWH[0] = '+mainWH[0]);
    ISPACES.log.debug(this.classId+'.createWeekCalendar(): totalWidth = '+totalWidth);
    ISPACES.log.debug(this.classId+'.createWeekCalendar(): this.headerWidth = '+this.headerWidth);

    //this.refreshWeekHeader();

    var divScroll=this.create.tag(Constants.Tags.DIV);
    var scrollbarWidth=getScrollbarWidth();
    ISPACES.log.debug(this.classId+'.createWeekCalendar(): scrollbarWidth = '+scrollbarWidth);
    divScroll.wi((scrollbarWidth-1));
    divScroll.hi(this.heightDayHeader);
    //divScroll.ba(this.colorHeader);
    divScroll.bo(CCC1);
    divScroll.boW('1px 1px 1px 0');

    var weekHeaderTableDiv=this.create.divCell(this.weekHeaderTable);
    weekHeaderTableDiv.alT();
    var weekHeaderTableDivScroll=this.create.divCell(divScroll);
    weekHeaderTableDivScroll.wip(1);
    var weekHeaderTableDivRow=this.create.divRow([weekHeaderTableDiv,weekHeaderTableDivScroll]);
    var weekHeaderTableDivTable=this.create.divTable(weekHeaderTableDivRow);
    weekHeaderTableDivTable.wip(100);
    //weekHeaderTableDivTable.ow(Constants.Properties.HIDDEN);
    //weekHeaderTableDivTable.ow('scroll');

    this.weekDiv.add(weekHeaderTableDivTable);
    this.weekDiv.owX(Constants.Properties.HIDDEN);
    //this.weekDiv.owY(Constants.Properties.HIDDEN);
    this.divMain.add(this.weekDiv);

    this.weekTableDiv=this.create.tag(Constants.Tags.DIV);
    this.weekTableDiv.owX(Constants.Properties.HIDDEN);
    this.weekTableDiv.owY(Constants.Properties.AUTO);
    this.weekTableDiv.hi(mainWH[1]-this.heightDayHeader-2);
    //this.weekTableDiv.hip(100);
    //this.rse.addResizable(this.weekTableDiv);
    this.addResizable(this.weekTableDiv);
    this.weekTableDiv.name='this.weekTableDiv';

    this.weekTable=Common.Create.table(null,1);
    this.weekTable.setClass('week');

    this.weekTableDiv.add(this.weekTable);
    this.weekDiv.add(this.weekTableDiv);
    //this.weekDiv.name='this.weekDiv';

    this.refreshWeek();

  }

  ,refreshWeekHeader:function(weekStartDate){
    ISPACES.log.debug(this.classId+'.refreshWeekHeader('+weekStartDate+')');

    if(!weekStartDate){
      weekStartDate=this.getWeekStartDate();
    }
    ISPACES.log.debug(this.classId+'.refreshWeekHeader(): weekStartDate = '+weekStartDate);

    var month=this.month+1;
    var daysInMonth=this.getDaysInMonth();
    ISPACES.log.debug(this.classId+'.refreshWeekHeader(): daysInMonth = '+daysInMonth);

    var weekEndDate=weekStartDate+(this.daysInWeek-1);
    if(weekEndDate>daysInMonth){
      weekEndDate=weekEndDate-daysInMonth;
    }
    ISPACES.log.debug(this.classId+'.refreshWeekHeader(): weekEndDate = '+weekEndDate);

    var weekDate=weekStartDate;
    var tHead=this.create.tag(Constants.Tags.THEAD);
    var cols=this.daysInWeek;
    var tr=this.create.tag(Constants.Tags.TR);
    this.weekHeaderTds=[];
    for(var i=-1;i<cols;i++){
      var th=this.create.tag(Constants.Tags.Constants.Tags.TH);
      //td.id='weekHeader'+i;
      tr.add(th);

      if(i==-1){ // The time column

        var divTime=this.create.tag(Constants.Tags.DIV);
        divTime.wi(33);
        //divTime.co('#6c6c6c');
        //divTime.ba(this.colorHeader);
        divTime.add(Common.Create.txt(Constants.Characters.NBSP));
        th.wi(33);
        th.add(divTime);

      }else{

        if(weekDate>daysInMonth){
          weekDate=1;
          month+=1;
        }

        var divDay=this.create.tag(Constants.Tags.DIV);
        //divDay.wi(this.headerWidth);
        divDay.miWi(this.headerWidthMiWi);
        //divDay.hi(33);
        divDay.fW('bold');
        divDay.fZ(14);
        //divDay.co('#6c6c6c'); // #6c6c6c, #40AF22
        //divDay.ba(F7F7F7);
        if(this.dateSelected==weekDate){
          th.setClass('today');
          //divDay.co(Constants.Colors.FFF);
          //divDay.co('#5d5d5d');
        }else{
          this.weekHeaderTds.push(th);
        }
        divDay.boW('1px 0 1px 0');
        //divDay.alC();
        //divDay.ma('8px 0 -8px 0');

        divDay.add(Common.Create.txt(this.DAYS_ABBR[i]));
        //divDay.add(Common.Create.txt(Constants.Characters.SPACE+weekDate++));

        //divDay.add(Common.Create.txt(Constants.Characters.SPACE+this.getTh(weekDate++)));
        //divDay.add(Common.Create.txt(Constants.Characters.SPACE+(weekDate++)+'/'+month));
        divDay.add(Common.Create.txt(Constants.Characters.SPACE+(month)+'/'+(weekDate++)));


        th.hi(this.heightDayHeader);
        th.alCM();
        th.add(divDay);

      }
    }
    tHead.add(tr);
    //this.weekHeaderTable.add(tHead);

    var curHead=_(this.weekHeaderTable,Constants.Tags.THEAD);

    if(curHead&&curHead.length>0){
      ISPACES.log.debug(this.classId+'.refresh(): curHead = '+curHead);
      ISPACES.log.debug(this.classId+'.refresh(): curHead.length = '+curHead.length);
      //this.weekHeaderTable.replace(tHead,curHead[0]);
      this.weekHeaderTable.replaceFirst(tHead);
    }else{
      this.weekHeaderTable.add(tHead);
    }

  }

  ,refreshWeek:function(weekStartDate){
    ISPACES.log.debug(this.classId+'.refreshWeek('+weekStartDate+')');

    if(!this.weekHeaderTable){
      this.createWeekCalendar();
    }

    if(!weekStartDate){
      weekStartDate=this.getWeekStartDate();
    }
    var weekDate=weekStartDate;
    ISPACES.log.debug(this.classId+'.refreshWeek('+weekStartDate+'): weekDate = '+weekDate);

    this.refreshWeekHeader(weekStartDate);

    this.monthSelector.hide();
    this.weekSelector.show();
    if(this.monthDiv)this.monthDiv.hide();
    this.weekDiv.show();

    ISPACES.log.debug(this.classId+'.refreshWeek(): this.apHeight = '+this.apHeight);
    var mainWH=Common.getWH(this.divMain);
    ISPACES.log.debug(this.classId+'.refreshWeek(): mainWH[1] = '+mainWH[1]);

    //this.weekTable.hi(mainWH[1]);
    //this.weekTable.ow(Constants.Properties.AUTO);

    var tBody=this.create.tag('tbody');
    //this.tBodyWeek=this.create.tag(Constants.Tags.TBODY);
    /*
    tBody.hi(mainWH[1]-this.heightDayHeader);
    //tBody.ow('auto');
    tBody.style.overflowX='hidden';
    tBody.style.overflowY='scroll';
    */
    //this.tBodyWeek.hi(mainWH[1]-this.heightDayHeader-3);
    //this.tBodyWeek.owX('hidden');
    //this.tBodyWeek.owY('scroll');

    //this.rse.addResizable(this.tBodyWeek);

    var hourOfDay=11;
    var hour=hourOfDay;
    var cols=this.daysInWeek;
    //cols++; // The scrolling column
    var rows=24;
    var amPm='am';
    var isPm=false;
    var workDay=false;

    var newHour=false;
    var tdHeight=40;

    this.weekColgroups=[];
    //this.weekTable.sA('rules','groups');
/*
    for(var i=-1;j<cols;j++){
      var colgroup=this.create.tag('colgroup');
      if(i>0){
        colgroup.bo('red 2px solid');
        colgroup.ba('orange');
      }
      this.weekColgroups[j]=colgroup;
      this.weekTable.add(colgroup);
    }
*/

    this.weekTds=[];
    for(var i=0;i<rows;i++){
      var tr=this.create.tag(Constants.Tags.TR);

      if(i==12){
        amPm='pm';
        isPm=true;
      }

      //ISPACES.log.debug(this.classId+'.refreshWeek(): hour = '+hour);

      hourOfDay=this.getNextHour(hourOfDay);

      var hourArray=[hourOfDay,amPm];
      hour=hourArray.join(Constants.Characters.EMPTY);
      //var sb=new ISPACES.StringBuilder([hourOfDay,amPm]);
      //hour=sb.asString();

      //ISPACES.log.debug(this.classId+'.refreshWeek(): hour = '+hour);

      //workDay=(isPm&&(hourOfDay>=8||hourOfDay<5));
      //workDay=((hourOfDay>=8&&!isPm)||(isPm&&hourOfDay<5));
      //workDay=((!isPm&&hourOfDay>=8&&hourOfDay!=12)||(isPm&&(hourOfDay<5||hourOfDay==12)));

      tr.hourOfDay=hourOfDay;

      for(var j=-1;j<cols;j++){
        //var td=this.create.tag(Constants.Tags.TD);
        var td=this.create.tag((j==-1)?Constants.Tags.Constants.Tags.TH:Constants.Tags.TD);

        tr.add(td);
        td.hi(tdHeight);
        var weekend=(j==0||j==(cols-1));
        //var today=(j==this.weekday);
        var today=((j+weekStartDate)==this.date);


        if(j>-1&&!today){
          this.weekTds.push(td);
        }

///*
        if(i==0){
          var colgroup=this.create.tag('colgroup');
          if(j>-1&&!today){
            colgroup.bo('#ffcc00 3px solid');
          }
          this.weekColgroups[j]=colgroup;
          this.weekTable.add(colgroup);
        }
//*/

        if(j==-1){ // The time column


          //td.alTR();
          td.hip(100);
          td.wi(33);
/*
          //td.alCM();
          td.alR();
          td.fZ(10);
          td.wi(33);
          td.add(Common.Create.txt(hour));
          td.co('#6c6c6c');
          td.ba(F7F7F7);
*/
          var divTime=this.create.tag(Constants.Tags.DIV);
          divTime.alTR();
          divTime.fZ(10);
          divTime.wi(33);
          divTime.hi(tdHeight+1);
          divTime.add(Common.Create.txt(hour));
          divTime.co('#6c6c6c');
          //divTime.ba(F7F7F7);
          //divTime.ba(this.colorHeader);

          //td.ba(this.colorHeader);
          td.add(divTime);

        }else{

/*
          if(weekend||!workDay){
            td.weekend=true
            if(today){
              td.ba('#ffffcf'); // #FFDE00 - gold, #fff000, #fffff0
              //td.bo('#ffff99 2px solid'); // #FFDE00 - gold, #fff000, #fffff0
            }else{
              td.ba(EEE);
            }
          }else{
            if(today){
              td.ba('#ffffef');
            }else{
              td.ba(Constants.Colors.FFF)
            }
          }
*/
          if(today){
            //td.ba('#ffffcf'); // #FFDE00 - gold, #fff000, #fffff0
            //td.ba('#FFEe88'); // #FFDE00 - gold, #fff000, #fffff0, yellow #fff000, #Constants.Colors.FFF888
            //td.ba('#F6E7E0'); // #ffde00 - gold, #fff000, #fffff0, yellow #fff000, #fff888
            //td.ba(this.colorToday);
            td.setClass('today');
          }else{
            td.ba(Constants.Colors.FFF)
          }

/*
        var divDay=this.create.tag(Constants.Tags.DIV);
        divDay.wi(this.headerWidth);
        divDay.hi(33);
        divDay.fW('bold');
        divDay.fZ(14);
        divDay.co('#6c6c6c');
        divDay.ba(F7F7F7);
        divDay.add(Common.Create.txt(this.DAYS_ABBR[i]));
*/

          var div0=this.create.tag(Constants.Tags.DIV);
          var div1=this.create.tag(Constants.Tags.DIV);
          if(weekend){
            div0.boB('#ddd 1px dotted');
          }else{
            div0.boB('#ddd 1px dotted');
          }
          //div0.boW('orange 1px solid');
          //div0.wip(100);
          div0.hi(tdHeight/2);
          //div0.ba('green');
          div0.add(Common.Create.txt(Constants.Characters.NBSP));
          //div1.wip(100);
          div1.hi(tdHeight/2);
          //div1.ba('orange');
          div1.add(Common.Create.txt(Constants.Characters.NBSP));
          var div2=this.create.tag(Constants.Tags.DIV);
          //div2.wi(this.headerWidth);
          div2.miWi(this.headerWidthMiWi);
          //div2.wip(100);
          div2.add(div0);
          div2.add(div1);



          td.add(div2);

          //td.paL('1px');
          //td.maL('1px');
          //td.boL('orange 1px solid');
          //if(newHour){
          //  td.style.borderWidth='1px 1px 0 1px';
          //}else{
          //  td.style.borderWidth='0 1px 1px 1px';
          //}

          td.dayOfWeek=this.DAYS[j];

        }
      }
/*
      if(i%2==0){
        hourOfDay=this.getNextHour(hourOfDay);
        hour=hourOfDay;
      }else{
        hour=hourOfDay+.5;
      }
*/
      tBody.add(tr);
      //this.tBodyWeek.add(tr);

    }

    //var curBody=_(this.weekTable,Constants.Tags.TBODY);
    var curBody=this.weekTable.getElementsByTagName(Constants.Tags.TBODY);

    if(curBody&&curBody.length>0){
      ISPACES.log.debug(this.classId+'.refresh(): curBody = '+curBody);
      ISPACES.log.debug(this.classId+'.refresh(): curBody.length = '+curBody.length);
      this.weekTable.replaceFirst(tBody);
      //this.weekTable.replace(this.tBodyWeek,curBody[0]);
    }else{
      this.weekTable.add(tBody);
      //this.weekTable.add(this.tBodyWeek);
    }

  }

  ,refreshMonth:function(){
    //ISPACES.log.alert(this.classId+'.refreshMonth()');

    var _this=this;

    var monthDate=new Date(this.year,this.month,1);
    this.monthWeekday=monthDate.getDay();
    ISPACES.log.debug(this.classId+'.refreshMonth(): monthDate = '+monthDate);
    ISPACES.log.debug(this.classId+'.refreshMonth(): this.monthWeekday = '+this.monthWeekday);
    ISPACES.log.debug(this.classId+'.refreshMonth(): this.entries.length = '+this.entries.length);

    this.weekStartDay=0;
    var offset=0;
    offset=(this.monthWeekday>=this.weekStartDay)?this.monthWeekday-this.weekStartDay:7-this.weekStartDay+this.monthWeekday;
    ISPACES.log.debug(this.classId+'.refreshMonth(): offset = '+offset);

    var daysInMonth=this.getDaysInMonth();

    var daysInMonthPrev=this.DAYS_IN_MONTH[this.getMnthPrev(this.month)];
    ISPACES.log.debug(this.classId+'.refreshMonth(): daysInMonth = '+daysInMonth);
    ISPACES.log.debug(this.classId+'.refreshMonth(): daysInMonthPrev = '+daysInMonthPrev);

    var tBody=this.create.tag(Constants.Tags.TBODY);

    var dayOfMonth=0;

    // cols & rows (dynamic)
    var cols=this.daysInWeek;
    var daysCount=0;
    var rows=1;
    var daysInRowOne=this.daysInWeek-this.monthWeekday;
    ISPACES.log.debug(this.classId+'.refreshMonth(): daysInRowOne = '+daysInRowOne);
    daysCount+=daysInRowOne;
    ISPACES.log.debug(this.classId+'.refreshMonth(): daysCount = '+daysCount);
    while(daysCount<daysInMonth){
      daysCount+=this.daysInWeek;
      ISPACES.log.debug(this.classId+'.refreshMonth(): daysCount = '+daysCount);
      rows++;
      ISPACES.log.debug(this.classId+'.refreshMonth(): rows = '+rows);
    }
    ISPACES.log.debug(this.classId+'.refreshMonth(): rows = '+rows);

    for(var i=0;i<rows;i++){
      var tr=this.create.tag(Constants.Tags.TR);
      tBody.add(tr);
      for(var j=0;j<cols;j++){
        var td=this.create.tag(Constants.Tags.TD);
        tr.add(td);

        var weekend=(j==0||j==(cols-1));

        if(weekend){
          td.setClass('weekend');
          td.weekend=true;
        //}else{td.ba(Constants.Colors.FFF)}
        }

        if(
          i==0&&j>=this.monthWeekday  // if it is the first row and j is greater than the day this month starts on
          ||(i>0&&dayOfMonth<daysInMonth) // if it is any other row
        ){

          dayOfMonth++;
          td.dayOfMonth=dayOfMonth;
          td.dayOfWeek=this.DAYS[j];

          //var calItems=getCalItemsByDayMonthYear
          var calItems=this.getCalItemsByDay(dayOfMonth);
          if(calItems&&calItems.length>0){ // We have calendar entries
            ISPACES.log.debug(this.classId+'.refreshMonth(): calItems ='+calItems.length);
            var calItemsDiv=this.createCalItemsDiv(calItems,td.dayOfMonth);
            td.ow(Constants.Properties.HIDDEN);
            td.add(calItemsDiv);
            td.alT();
          }else{ // no entries

            td.fW(Constants.Properties.BOLD);
            td.alCM();
            td.add(Common.Create.txt(dayOfMonth));

            td.addListener(
              Constants.Events.MOUSEOVER
              ,function(){
                //this.baco('#ffcc00',Constants.Colors.FFF);
                //_this.divDay.innerHTML=_this.getDayTh(this.dayOfWeek,this.dayOfMonth);
                this.setClass('weekend-on');
              }
            );

            if(weekend){
              //td.mf(function(){this.baco(_this.colorWeekend,OOO)})
              td.addListener(
                Constants.Events.MOUSEOUT
                ,function(){this.setClass('weekend')}
              );
            }else{
              //td.mf(function(){this.baco(Constants.Colors.FFF,OOO)});
              td.addListener(
                Constants.Events.MOUSEOUT
                ,function(){this.setClass('off')}
              );
            }
            //td.add(Common.Create.txt(dayOfMonth));
          }


/*
          for(var i=0;i<this.entries.length;i++){
            //ISPACES.log.alert('this.entries['+i+'] = '+this.entries[i]);
            //ISPACES.log.alert('this.entries['+i+'].where = '+this.entries[i].where);
            //var calItem=this.entries[i];
          }
            ISPACES.log.debug(this.classId+'.refreshMonth(): calItem = '+calItem);
            ISPACES.log.debug(this.classId+'.refreshMonth(): calItem[\'where\'] = '+calItem['where']);
*/
          var today=(dayOfMonth==this.date&&this.monthSelected==this.month);
          ISPACES.log.debug(this.classId+'.refreshMonth(): dayOfMonth:'+dayOfMonth+', today = '+today);
          if(today){
            ISPACES.log.debug(this.classId+'.refreshMonth(): dayOfMonth:'+dayOfMonth+', today = '+today);
            td.setClass('today');
            //td.ba('#ffcc00');
          }

          //td.dc(function(){alert('dbllick')}); // double click

          //td.oc(function(){
          td.addListener(
            Constants.Events.CLICK
            ,function(){

              ISPACES.log.alert(_this.classId+'.refreshMonth(): td.oc()');

              _td=this;

              //this.ba('#ffcc00');
              this.ba('red');
              this.mf(null);

              var apWH=Common.getWH(_this.apDiv);
              var mainWH=Common.getWH(_this.divMain);
              var menuWH=Common.getWH(_this.menu);
              ISPACES.log.alert(_this.classId+'.refreshMonth(): td.oc(): apWH[1] = '+apWH[1]+', mainWH[1] = '+mainWH[1]+', menuWH[1] = '+menuWH[1]);

              /*
              var td=this.create.tag(Constants.Tags.TD);
              td.style.opacity='0.77';
              td.ba('#333');
              td.co(Constants.Colors.FFF);
              td.wiphip(100,100);
              var tr=this.create.tag(Constants.Tags.TR);
              tr.add(td);
              _this.greyout=Common.Create.table();
              _this.greyout.wiphip(100,100);
              _this.greyout.add(tr);
              //td.hi(apWH[1]);
              _this.greyout.rel(0,-(apWH[1]));
              */
              ///*
              //_this.greyout=this.create.tag(Constants.Tags.DIV);
              _this.greyout=this.create.tagClass(Constants.Tags.DIV,'greyout');
              //_this.greyout.op(_this.opacityGreyout,_this.colorGreyout);

              //_this.greyout.rel(0,-(apWH[1]));
              //_this.greyout.hi(apWH[1]);
              _this.greyout.rel(0,-(mainWH[1]));
              _this.greyout.hi(mainWH[1]);
              //*/

              _this.apDiv.add(_this.greyout); // Add the greyout layer.
              // Re-adjust the app height after adding the greyout layer.
              _this.apDiv.ow(Constants.Properties.HIDDEN);
              _this.apDiv.hi(apWH[1]);
              //_this.apDiv.hi(Constants.Properties.AUTO); // Opera needs this

              //_this.resizableWindow.window.hi(apWH[1]+30);

              // Either enable resizing of the greyout layer or disable resizing during greyout.
              /*
              // resizing
              //_this.rse.addResizable(_this.greyout);
              //_this.rse.addResizable(td);
              */
              // disabling
              _this.disableResizing();

              var options={
                //top:'100px',
                //left:'100px',
                background:Constants.Colors.FFF,
                //border:'#333 2px solid',
                //border:'#353635 2px solid',
                //border:'#333 1px solid',
                //border:'#fff 1px solid',
                border:'#A1A1A1 1px solid',

                //margin:'20px',
                //height:200,
                //width:apWH[0]-50,
                wip:40,
                //width:Constants.Properties.AUTO,
                //opacity:'0.88',
                draggable:false,
                maxable:false,

                title:{
                  background:OOO,
                  color:Constants.Colors.FFF
                }

              };

              //var modalWindow=new Window('addEvent','Add Event',options);
              _this.setDayOfMonth(this.dayOfMonth);
              //var modalWindow=new Window('addEvent','Add Event: '+_this.getDateTh(this.dayOfWeek,this.dayOfMonth),options);
              var modalWindow=new ModalWindow('addEvent',_this.getDateTh(this.dayOfWeek,this.dayOfMonth),options);

              //modalWindow.addHideable(_this.greyout);

              // Inner class: Hideable.
              var Hideable=function(ap,td){
                this.ap=ap;
                this.td=td;
              };
              Hideable.prototype.hide=function(){
                this.ap.greyout.hide();
                this.ap.centeringTable.hide();
                this.ap.enableResizing();
                if(this.td.weekend){
                  this.td.baco(EEE,OOO);
                  this.td.mf(function(){this.baco(EEE,OOO)});
                }else{
                  this.td.baco(Constants.Colors.FFF,OOO);
                  this.td.mf(function(){this.baco(Constants.Colors.FFF,OOO)});
                }
              };

              var hidethis=new Hideable(_this,_td);
              modalWindow.addHideable(hidethis);

              var div=this.create.tag(Constants.Tags.DIV);
              div.ba(Constants.Colors.FFF);
              //div.alCM();
              //div.rel(0,-(apWH[1]*2));

              //var formName='form-calendar-entry'_td;
              var formName='form-calendar-entry'+_td.dayOfMonth;
              var form=this.create.tagId('form',formName);
              form.name=formName;

              var year=ISPACES.ui.createInput(Constants.Properties.HIDDEN,YEAR,_this.year);
              var month=ISPACES.ui.createInput(Constants.Properties.HIDDEN,MONTH,_this.month);
              var day=ISPACES.ui.createInput(Constants.Properties.HIDDEN,DAY,this.dayOfMonth);
              var what=ISPACES.ui.createFormElement('What','text','what',null);
              var when=ISPACES.ui.createFormElement('When','text','when',null);
              var where=ISPACES.ui.createFormElement('Where','text','where',null);
              var notes=ISPACES.ui.createFormElement('Notes','text','notes',null);
              //var save=ISPACES.ui.createFormElement(Constants.Characters.EMPTY,'button','save','Save');

              /*
              var inputWhat=cI('text','name','name');
              var inputWhen=cI('text','when','name');
              var inputWhere=cI('text','where','name');
              var inputNotes=cI('text','notes',null);
              */
              var inputSave=ISPACES.ui.createInput('button','save','Save');

              //inputSave.onclick=function(){alert('test')};
              inputSave.oc(function(){

                ISPACES.log.debug(_this.classId+'.refreshMonth(): inputSave.oc()');
                ISPACES.log.debug(_this.classId+'.refreshMonth(): inputSave.oc(): modalWindow.id = '+ modalWindow.id);

                /*
                var fields=[YEAR,MONTH,DAY,'what','when','where','notes'];
                //var calendarEntryObject=formToObject($('form-calendar-entry'),fields);
                var calItemJson=formToObjectString(formName,fields);
                ISPACES.log.alert('calItemJson = '+calItemJson);
                //var calItem=JSON.parse(line);
                var calItem=eval(Common.parens(calItemJson));
                _this.updateStore(_this.entriesName,calItem);
                */

                var url=Ajax.serialize(form);
                ISPACES.log.debug(_this.classId+'.refreshMonth(): url = '+url);
                var baseUrl=contextUrl+Constants.Characters.FSLASH+this.objectId;
                //ISPACES.log.alert(this.classId+'.doLogin(): baseUrl = '+baseUrl);
                var qs=new ISPACES.QueryString();
                //qs.append(form.action);
                qs.append(_this.objectId);
                qs.append(QUESTION);
                qs.append(url);
                qs.add(TASKID,'save');
                ISPACES.log.alert(_this.classId+'.refreshMonth(): qs.asString() = '+qs.asString());
                var ajax=new ISPACES.Ajax(qs.asString(),function(r){_this.processSave(r)});
                ajax.doGet();


  /*
                //alert(calendarEntryObject.toJSONString());
                //ISPACES.log.debug('calendarEntryObject.toJson(): '+calendarEntryObject.toJson());
                //alert('calendarEntryObject.toJson().asString(): '+calendarEntryObject.toJson().asString());
                var json=JSON.stringify(calendarEntryObject);
                //ISPACES.log.debug('JSON.stringify(calendarEntryObject) = '+JSON.stringify(calendarEntryObject));
                ISPACES.log.debug('json = '+json);

                //var jsonObj=JSON.parse(json);
                var jsonObj=JSON.parse(json, function (key, value) {
                    var d;
                    if (typeof value === 'string' &&
                            value.slice(0, 5) === 'Date(' &&
                            value.slice(-1) === ')') {
                        d = new Date(value.slice(5, -1));
                        if (d) {
                            return d;
                        }
                    }
                    alert('return '+value);
                    return value;
                });

                if(jsonObj){
                  alert('jsonObj');
                  alert('typeof jsonObj = '+typeof jsonObj);
                  alert('jsonObj.what = '+jsonObj.what);
                  alert('jsonObj[where] = '+jsonObj['where']);
                }

                //var cI=eval(line);
                //var cI=JSON.parse(line);
                var cI=JSON.parse(line, function (key, value) {
                    var d;
                    if (typeof value === 'string' &&
                            value.slice(0, 5) === 'Date(' &&
                            value.slice(-1) === ')') {
                        d = new Date(value.slice(5, -1));
                        if (d) {
                            return d;
                        }
                    }
                    alert('return '+value);
                    return value;
                });
                alert('cI = '+cI);
                alert('typeof cI = '+typeof cI);
                ISPACES.log.printObject(cI);
                for(var n in cI){
                  ISPACES.log.debug('n = '+n);
                  //alert('calItem['+n+'] = '+calItem[n]);
                  //var v = calItem[n];
                  //alert(n+' = '+v);
                }
                if(cI){
                  alert('cI');
                  alert('typeof cI = '+typeof cI);
                  alert('cI.what = '+cI.what);
                  alert('cI[where] = '+cI['where']);
                }

                alert('_this.store.get(\'entryCountName\') = "'+_this.store.get(_this.entryCountName)+'"');
                _this.entryCount=parseInt(_this.getEntryCount());
                alert('_this.entryCount='+_this.entryCount);
                _this.entryCount+=1;
                _this.store.set(_this.entryCountName,(_this.entryCount));
                _this.checkLocalStorage();
                _this.getEntries();

  */

                _this.refreshMonth();
                modalWindow.hide();
              });
              var tdSave=this.create.tag(Constants.Tags.TD);
              tdSave.add(inputSave);
              //var save=Common.Create.tR([null,input])
              //var save=Common.Create.tR([new Td(Constants.Characters.NBSP),input])
              var tdNbsp=Common.Create.tD(Common.Create.txt(Constants.Characters.NBSP));
              var save=Common.Create.tR([tdNbsp,tdSave]);
              //var save=Common.Create.tR([tdSave])

              var eventTable=Common.Create.table(2,0);
              eventTable.setClass('calendarevent');
  /*
              var tdWhat=this.create.tag(Constants.Tags.TD);
              tdWhat.add(inputWhat);
              var tdWhen=this.create.tag(Constants.Tags.TD);
              tdWhen.add(inputWhen);
              var tdWhere=this.create.tag(Constants.Tags.TD);
              tdWhere.add(inputWhere);
              var tdNotes=this.create.tag(Constants.Tags.TD);
              tdNotes.add(inputNotes);
              var tdSave=this.create.tag(Constants.Tags.TD);
              tdSave.add(inputSave);
              eventTable.aCnTR([tdWhat,tdWhen,tdWhere,tdNotes,tdSave]);
  */
              //eventTable.addAll([year,month,day,what,when,where,notes,save]);
              eventTable.addAll([what,when,where,notes,save]);
              form.addAll([year,month,day]);

              //div.add(eventTable);
              form.add(eventTable);
              div.add(form);

              modalWindow.addContent(div);
              modalWindow.window.bo('#ccc 1px solid');
              modalWindow.window.alCM();

              _this.centeringTable=Common.Create.table(); // Table for centering
              _this.centeringTable.wip(100);
              _this.centeringTable.hi(mainWH[1]);
              _this.centeringTable.rel(0,-(mainWH[1]*2));
              var td=this.create.tag(Constants.Tags.TD);
              td.alCM();
              td.wip(100);
              td.hi(mainWH[1]);
              var tr=Common.Create.tR(td);
              _this.centeringTable.add(tr);
              tr.add(td);


              /*
              _this.ap.add(modalWindow.window);
              modalWindow.window.maT('25px');
              modalWindow.window.rel(0,-(mainWH[1]*2));
              */

              td.add(modalWindow.window);
              _this.apDiv.add(_this.centeringTable);

            }

            ,false
          );

        }
        //tr.add(td);
      }
      //tBody.add(tr);
    }

    //var curBody=_(this.monthTable,Constants.Tags.TBODY);
    var curBody=this.monthTable.getElementsByTagName(Constants.Tags.TBODY);

    //ISPACES.log.debug(this.classId+'.refreshMonth(): curBody = '+curBody);
    if(curBody&&curBody.length>0){
      //ISPACES.log.alert(this.classId+'.refreshMonth(): curBody = '+curBody);
      //ISPACES.log.debug(this.classId+'.refreshMonth(): curBody.length = '+curBody.length);
      this.monthTable.replace(tBody,curBody[0]);
      //var curBody2=_(this.monthTable,'tbody');
      //ISPACES.log.debug(this.classId+'.refreshMonth(): curBody2 = '+curBody2);
      //ISPACES.log.debug(this.classId+'.refreshMonth(): curBody2.length = '+curBody2.length);
    }else{
      this.monthTable.add(tBody);
    }

    //_this=null;

  }

  ,processSave:function(r){
    ISPACES.log.alert(this.classId+'.processSave('+r+')');
  }

  ,disableResizing:function(){
    ISPACES.log.alert(this.classId+'.disableResizing()');
    /*
    for(var i=0;i<this.handles.length;i++){
      this.handles[i].disable();
    }
    */
  }

  ,enableResizing:function(){
    ISPACES.log.alert(this.classId+'.enableResizing()');
    /*
    for(var i=0;i<this.handles.length;i++){
      this.handles[i].enable();
    }
    */
  }

  ,addResizable:function(resizable){
    ISPACES.log.debug(this.classId+'.addResizable()');
    /*
    for(var i=0;i<this.handles.length;i++){
      this.handles[i].addResizable(resizable);
    }
    */
  }

  ,calculateHeight:function(){
    ISPACES.log.alert(this.classId+'.calculateHeight()');

    if(!viewableWH)viewableWH=getViewableWH();
    if(this.topMenu)if(!this.topMenu.wh)this.topMenu.wh=Common.getWH(this.topMenu);

    /*
    ISPACES.log.alert(this.id+'.calculateHeight(): viewableWH[0] = '+viewableWH[0]+', viewableWH[1] = '+viewableWH[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): this.topMenu.wh[0] = '+this.topMenu.wh[0]+', this.topMenu.wh[1] = '+this.topMenu.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): this.bottomMenu.wh[0] = '+this.bottomMenu.wh[0]+', this.bottomMenu.wh[1] = '+this.bottomMenu.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): this.resizableWindow.titlebar.wh[0] = '+this.resizableWindow.titlebar.wh[0]+', this.resizableWindow.titlebar.wh[1] = '+this.resizableWindow.titlebar.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): taskbar.wh[0] = '+taskbar.wh[0]+', taskbar.wh[1] = '+taskbar.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): taskbar.divTable.wh[0] = '+taskbar.divTable.wh[0]+', taskbar.divTable.wh[1] = '+taskbar.divTable.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): taskbar.autoHiding = '+taskbar.autoHiding);
    */

    var h=viewableWH[1];
    if(this.topMenu)h-=this.topMenu.wh[1];
    h-=this.resizableWindow.titlebar.wh[1];
    h-=3; // Back the bottom off a little.
    //ISPACES.log.alert(this.id+'.calculateHeight(): h='+h);

    //return {w:w,h:h};
    //return {w:windowWH[0],h:h};
    return {w:viewableWH[0],h:h};

  }

  ,calculateAppDivHeight:function(){
    ISPACES.log.alert(this.classId+'.calculateAppDivHeight()');
    if(!viewableWH)viewableWH=getViewableWH();
    /*
    ISPACES.log.alert(this.id+'.calculateAppDivHeight(): viewableWH[0] = '+viewableWH[0]+', viewableWH[1] = '+viewableWH[1]);
    ISPACES.log.alert(this.id+'.calculateAppDivHeight(): this.topMenu.wh[0] = '+this.topMenu.wh[0]+', this.topMenu.wh[1] = '+this.topMenu.wh[1]);
    */
    var h=viewableWH[1];
    h-=this.resizableWindow.titlebar.wh[1];
    //ISPACES.log.alert(this.id+'.calculateAppDivHeight(): h='+h);
    return {w:viewableWH[0],h:h};
  }

  ,calculateHalfHeight:function(){
    ISPACES.log.alert(this.classId+'.calculateHalfHeight()');
    if(!viewableWH)viewableWH=getViewableWH();
    if(this.topMenu)if(!this.topMenu.wh)this.topMenu.wh=Common.getWH(this.topMenu);
    var h=viewableWH[1];
    var h=h/2;
    if(this.topMenu)h-=this.topMenu.wh[1];
    h-=this.resizableWindow.titlebar.wh[1];
    //ISPACES.log.alert(this.id+'.calculateHalfHeight(): h='+h);
    return {w:viewableWH[0],h:h};
  }

  ,calculateAppDivHalfHeight:function(){
    ISPACES.log.alert(this.classId+'.calculateAppDivHalfHeight()');
    if(!viewableWH)viewableWH=getViewableWH();
    var h=viewableWH[1];
    var h=h/2;
    h-=this.resizableWindow.titlebar.wh[1];
    //ISPACES.log.alert(this.id+'.calculateAppDivHalfHeight(): h='+h);
    return {w:viewableWH[0],h:h};
  }

  ,calculateHalfWidth:function(){
    ISPACES.log.alert(this.classId+'.calculateHalfWidth()');
    if(!viewableWH)viewableWH=getViewableWH();
    if(this.topMenu)if(!this.topMenu.wh)this.topMenu.wh=Common.getWH(this.topMenu);
    /*
    ISPACES.log.alert(this.id+'.calculateHalfWidth(): windowWH[0] = '+windowWH[0]+', windowWH[1] = '+windowWH[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): this.bottomMenu.wh[0] = '+this.bottomMenu.wh[0]+', this.bottomMenu.wh[1] = '+this.bottomMenu.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): this.resizableWindow.titlebar.wh[0] = '+this.resizableWindow.titlebar.wh[0]+', this.resizableWindow.titlebar.wh[1] = '+this.resizableWindow.titlebar.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): taskbar.wh[0] = '+taskbar.wh[0]+', taskbar.wh[1] = '+taskbar.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): taskbar.divTable.wh[0] = '+taskbar.divTable.wh[0]+', taskbar.divTable.wh[1] = '+taskbar.divTable.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHalfWidth(): taskbar.autoHiding = '+taskbar.autoHiding);
    */
    var h=viewableWH[1];
    if(this.topMenu)h-=this.topMenu.wh[1];
    h-=this.resizableWindow.titlebar.wh[1];
    h-=3; // Back the bottom off a little.
    //ISPACES.log.alert(this.id+'.calculateHeight(): h='+h);
    var wi=viewableWH[0];
    var wi=wi/2;
    //ISPACES.log.alert(this.id+'.calculateHalfWidth(): wi = '+wi);
    return {w:wi,h:h};
  }

  ,calculateAppDivHalfWidth:function(){
    ISPACES.log.alert(this.classId+'.calculateAppDivHalfWidth()');
    if(!viewableWH)viewableWH=getViewableWH();
    /*
    ISPACES.log.alert(this.id+'.calculateHalfWidth(): windowWH[0] = '+windowWH[0]+', windowWH[1] = '+windowWH[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): this.bottomMenu.wh[0] = '+this.bottomMenu.wh[0]+', this.bottomMenu.wh[1] = '+this.bottomMenu.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): this.resizableWindow.titlebar.wh[0] = '+this.resizableWindow.titlebar.wh[0]+', this.resizableWindow.titlebar.wh[1] = '+this.resizableWindow.titlebar.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): taskbar.wh[0] = '+taskbar.wh[0]+', taskbar.wh[1] = '+taskbar.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHeight(): taskbar.divTable.wh[0] = '+taskbar.divTable.wh[0]+', taskbar.divTable.wh[1] = '+taskbar.divTable.wh[1]);
    ISPACES.log.alert(this.id+'.calculateHalfWidth(): taskbar.autoHiding = '+taskbar.autoHiding);
    */
    var h=viewableWH[1];
    h-=this.resizableWindow.titlebar.wh[1];
    h-=3; // Back the bottom off a little.
    //ISPACES.log.alert(this.id+'.calculateHeight(): h='+h);
    var wi=viewableWH[0];
    var wi=wi/2;
    //ISPACES.log.alert(this.id+'.calculateHalfWidth(): wi = '+wi);
    return {w:wi,h:h};
  }

  ,maximize:function(){
    //ISPACES.log.debug(this.classId+'.maximize()');
    this.apDiv.wh=Common.getWH(this.apDiv);
    this.divMain.wh=Common.getWH(this.divMain);
    /*
    this.iframe.wh=Common.getWH(this.iframe); // Save the iframe width/height for restore.
    */
    /*
    ISPACES.log.alert(this.id+'.maximize(): this.apDiv.wh[0] = '+this.apDiv.wh[0]+', this.apDiv.wh[1] = '+this.apDiv.wh[1]);
    ISPACES.log.alert(this.id+'.maximize(): this.divMain.wh[0] = '+this.divMain.wh[0]+', this.divMain.wh[1] = '+this.divMain.wh[1]);
    ISPACES.log.alert(this.id+'.maximize(): this.iframe.wh[0]='+this.iframe.wh[0]+', this.iframe.wh[1]='+this.iframe.wh[1]);
    */
    var wh=this.calculateHeight();
    //this.iframe.wihi(wh[0],wh[1]);
    this.divMain.wihi(wh[0],wh[1]);
    //this.apDiv.wihi(wh[0],wh[1]);

    var apDivHeight=this.calculateAppDivHeight();
    this.apDiv.wihi(apDivHeight.w,apDivHeight.h);

    this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
  }

  ,restore:function(){
    //ISPACES.log.debug(this.classId+'.restore()');
    //this.showHandles();
    //this.iframe.wihi(this.iframe.wh[0],this.iframe.wh[1]);
    this.apDiv.wihi(this.apDiv.wh[0],this.apDiv.wh[1]);
    //this.apDiv.wi(this.apDiv.wh[0]);
    this.divMain.wihi(this.divMain.wh[0],this.divMain.wh[1]);
    /*
    ISPACES.log.alert(this.id+'.restore(): this.apDiv.wh[0] = '+this.apDiv.wh[0]+', this.apDiv.wh[1] = '+this.apDiv.wh[1]);
    ISPACES.log.alert(this.id+'.restore(): this.divMain.wh[0] = '+this.divMain.wh[0]+', this.divMain.wh[1] = '+this.divMain.wh[1]);
    */
    this.draggableAp.addMouseDown(); // Re-add the ability to drag the window.
    this.padHandles=true;
  }

  ,snapTop:function(){
    //ISPACES.log.debug(this.classId+'.snapTop()');
    this.apDiv.wh=Common.getWH(this.apDiv);
    this.divMain.wh=Common.getWH(this.divMain);
    /*
    ISPACES.log.alert(this.id+'.snapTop(): this.apDiv.wh[0] = '+this.apDiv.wh[0]+', this.apDiv.wh[1] = '+this.apDiv.wh[1]);
    ISPACES.log.alert(this.id+'.snapTop(): this.divMain.wh[0] = '+this.divMain.wh[0]+', this.divMain.wh[1] = '+this.divMain.wh[1]);
    */
    var wh=this.calculateHalfHeight();
    this.divMain.wihi(wh[0],wh[1]);

    var apDivHeight=this.calculateAppDivHalfHeight();
    this.apDiv.wihi(apDivHeight.w,apDivHeight.h);

    this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
    this.padHandles=false;
  }

  ,snapBottom:function(){
    //ISPACES.log.debug(this.classId+'.snapBottom()');
    this.apDiv.wh=Common.getWH(this.apDiv);
    this.divMain.wh=Common.getWH(this.divMain);
    var wh=this.calculateHalfHeight();
    this.divMain.wihi(wh[0],wh[1]-3); // Back the bottom off a little because of the shadow.
    var apDivHeight=this.calculateAppDivHalfHeight();
    this.apDiv.wihi(apDivHeight.w,apDivHeight.h-3);
    this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
    this.padHandles=false;
  }

  ,snapLeft:function(){
    //ISPACES.log.debug(this.classId+'.snapLeft()');
    this.apDiv.wh=Common.getWH(this.apDiv);
    this.divMain.wh=Common.getWH(this.divMain);
    var wh=this.calculateHalfWidth();
    this.divMain.wihi(wh[0],wh[1]-3); // Back the bottom off a little because of the shadow.
    var apDivHeight=this.calculateAppDivHalfWidth();
    this.apDiv.wihi(apDivHeight.w,apDivHeight.h-3);
    this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
    this.padHandles=false;
  }

  ,snapRight:function(){
    //ISPACES.log.debug(this.classId+'.snapRight()');
    this.apDiv.wh=Common.getWH(this.apDiv);
    this.divMain.wh=Common.getWH(this.divMain);
    var wh=this.calculateHalfWidth();
    this.divMain.wihi(wh[0],wh[1]-3); // Back the bottom off a little because of the shadow.
    var apDivHeight=this.calculateAppDivHalfWidth();
    this.apDiv.wihi(apDivHeight.w,apDivHeight.h-3);
    this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
    this.padHandles=false;
  }

  ,snapTopLeft:function(){
    //ISPACES.log.debug(this.classId+'.snapTopLeft()');
    this.apDiv.wh=Common.getWH(this.apDiv);
    this.divMain.wh=Common.getWH(this.divMain);

    var w=this.calculateHalfWidth();
    var h=this.calculateHalfHeight();
    this.divMain.wihi(w.w,h.h);

    var apDivWidth=this.calculateAppDivHalfWidth();
    var apDivHeight=this.calculateAppDivHalfHeight();
    this.apDiv.wihi(apDivWidth.w,apDivHeight.h);

    this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
    this.padHandles=false;
  }

  ,snapTopRight:function(){
    //ISPACES.log.debug(this.classId+'.snapTopRight()');

    this.apDiv.wh=Common.getWH(this.apDiv);
    this.divMain.wh=Common.getWH(this.divMain);

    var w=this.calculateHalfWidth();
    var h=this.calculateHalfHeight();
    this.divMain.wihi(w.w,h.h);

    var apDivWidth=this.calculateAppDivHalfWidth();
    var apDivHeight=this.calculateAppDivHalfHeight();
    this.apDiv.wihi(apDivWidth.w,apDivHeight.h);

    this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
    this.padHandles=false;
  }

  /*
  ,hideHandles:function(){
    ISPACES.log.debug(this.classId+'.hideHandles()');
    ISPACES.log.debug(this.classId+'.hideHandles(): this.handles.length = '+this.handles.length);
    for(var i=0;i<this.handles.length;i++){
      this.handles[i].hide();
      //this.s.hi(0);
    }
  }

  ,showHandles:function(){
    ISPACES.log.debug(this.classId+'.showHandles()');
    //ISPACES.log.alert(this.classId+'.showHandles(): this.handles.length = '+this.handles.length);
    for(var i=0;i<this.handles.length;i++){
      this.handles[i].show();
    }
  }
  */

  ,getDateTh:function(dayOfWeek,dayOfMonth){
    ISPACES.log.debug(this.classId+'.getDateTh('+dayOfWeek+','+dayOfMonth+')');
    var sb = new ISPACES.StringBuilder();
    sb.append(dayOfWeek);
    sb.append(COMMASPACE);
    sb.append(this.getMnth());
    sb.append(Constants.Characters.SPACE);
    sb.append(this.getTh(dayOfMonth));
    sb.append(Constants.Characters.SPACE);
    sb.append(this.year);
    ISPACES.log.debug(this.classId+'.getDateTh('+dayOfWeek+','+dayOfMonth+') = '+sb.asString());
    return sb.asString();
  }

  ,getDayTh:function(dayOfWeek,dayOfMonth){
    ISPACES.log.debug(this.classId+'.getDayTh('+dayOfWeek+','+dayOfMonth+')');
    var sb = new ISPACES.StringBuilder();
    sb.append(dayOfWeek);
    sb.append(Constants.Characters.SPACE);
    sb.append(this.getTh(dayOfMonth));
    ISPACES.log.debug(this.classId+'.getDayTh('+dayOfWeek+','+dayOfMonth+') = '+sb.asString());
    return sb.asString();
  }

  ,getTh:function(dayOfMonth){
    ISPACES.log.debug(this.classId+'.getTh('+dayOfMonth+')');
    var sb = new ISPACES.StringBuilder();
    sb.append(dayOfMonth);
    switch(dayOfMonth){
      case 1:
      case 21:
      case 31:
        sb.append(ST);break;
      case 2:
      case 22:
        sb.append(ND);break;
      case 3:
      case 23:
        sb.append(RD);break;
      default:
        sb.append(Constants.Tags.TH);
    }
    ISPACES.log.debug(this.classId+'.getTh('+dayOfMonth+') = '+sb.asString());
    return sb.asString();
  }

///*
  ,getDaysInMonth:function(){
    ISPACES.log.debug(this.classId+'.getDaysInMonth()');
    var daysInMonth=this.DAYS_IN_MONTH[this.month];
    if(this.month==1&&((this.year%4 == 0)&&(this.year%100!= 0))||(this.year%400==0)){
      daysInMonth=29;
    }
    return daysInMonth;
  }
//*/
/* Using a switch statement to get days of month
  getDaysInMonth:function(){
    ISPACES.log.debug(this.classId+'.getDaysInMonth()');
    var days=0;
    switch(this.month){
      case 1:case 3:case 5:case 8:case 10:case 12:days=31;break;
      case 4:case 6:case 9:case 11:days=30;break;
      case 2:
        if(((year%4==0)&&!(year%100==0))||(year%400==0)){
          days = 29;
        }else{
          days = 28;
        }
        break;
      default:
        days=0;
        break;
    }
    return days;
  }
*/

  ,getEntryCount:function(){
    ISPACES.log.debug(this.classId+'.getEntryCount()');
    /*
    var entryCount=this.store.get(this.entryCountName);
    ISPACES.log.debug(this.classId+'.getEntryCount(): entryCount = "'+entryCount+'"');
    //if(entryCount&&(!entryCount==NaN)){
    if(entryCount){
      return parseInt(entryCount);
    }else{
      return 0;
    }
    */
  }

  ,getEntries:function(){
    ISPACES.log.debug(this.classId+'.getEntries()');
    ISPACES.log.debug(this.classId+'.getEntries(): this.entryCount = '+this.entryCount);
    for(var i=0;i<this.entryCount;i++){
      ISPACES.log.debug(this.classId+'.getEntries(): entry'+i);
      /*
      this.store.get('entry'+i,function(ok,val){
        if(ok){
          ISPACES.log.error(this.classId+'.getEntries(): entry'+i+', val = ' + val);
          if(!isNull(val)){
            ISPACES.log.debug(this.classId+'.getEntries(): isNull(val) = ' + (isNull(val)));
            //var entry=JSON.parse(val);
            var entry=eval(Common.parens(val));
            //ISPACES.log.error(this.classId+'.getEntries(): entry'+i+', entry = '+entry);
            //ISPACES.log.error(this.classId+'.getEntries(): entry'+i+', typeof entry = '+typeof entry);
            //ISPACES.log.printObject(entry);
            //for(var n in entry){
              //ISPACES.log.debug('n = '+n);
              //alert('entry['+n+'] = '+entry[n]);
              //var v = entry[n];
              //alert(n+' = '+v);
            //}
            //for(var object
            //ISPACES.log.error(this.classId+'.getEntries(): entry'+i+', entry.what = '+entry.what);
            //ISPACES.log.error(this.classId+'.getEntries(): entry'+i+', entry.when = '+entry.when);
            ISPACES.log.debug(this.classId+'.getEntries(): entry'+i+', entry[where] = '+entry['where']);
          }
        }
      });
      */
    }
  }

  //createCalItemsDiv:function(calItems){
  ,createCalItemsDiv:function(calItems,day){
    ISPACES.log.debug(this.classId+'.createCalItemsDiv('+calItems+')');
    ISPACES.log.debug(this.classId+'.createCalItemsDiv('+calItems+'): calItems.length = '+calItems.length);

    var bgColor='#fff888';
    //var bgColor='#FFD324';
    //var bgColor='#ffee88';
    var color='#333';

    var outerDiv=this.create.tag(Constants.Tags.DIV);
    //outerDiv.bo('green 1px solid');
    outerDiv.alT();
    //outerDiv.wiphip(100);
    //outerDiv.ow(Constants.Properties.HIDDEN);
    var dayDiv=this.create.tag(Constants.Tags.DIV);
    //dayDiv.ba(ORANGE);
    //dayDiv.ba('#ffcc00');
    //dayDiv.baco('#ffcc00','#fff');
    //dayDiv.baco('#fffccc','#fff');
    dayDiv.baco(bgColor,color);
    dayDiv.fW(Constants.Properties.BOLD);
    dayDiv.pa('0 0 0 2px');
    dayDiv.add(Common.Create.txt(day));
    outerDiv.add(dayDiv);
    //outerDiv.ma('1px');
    for(var i=0;i<calItems.length;i++){
      var innerDiv=this.create.tag(Constants.Tags.DIV);
      innerDiv.bo(bgColor+' 1px solid');
      //innerDiv.ma('1px');
      var calItemDiv=this.createCalItemDiv(calItems[i]);
      calItemDiv.hide();
      var calItemSummary=this.getCalItemSummary(calItems[i]);
      innerDiv.add(Common.Create.txt(calItemSummary));
      innerDiv.add(calItemDiv);
      //div.hide();
      outerDiv.add(innerDiv);
    }
    return outerDiv;
  }

  ,getCalItemSummary:function(calItem){
    var sb=new ISPACES.StringBuilder();
    sb.append(calItem.what);
    sb.append(', ');
    sb.append(calItem.when);
    sb.append(' at ');
    sb.append(calItem.where);
    return sb.asString()
  }

  ,createCalItemDiv:function(calItem){
    ISPACES.log.debug(this.classId+'.createCalItemDiv('+calItem+')');
    ISPACES.log.debug(this.classId+'.createCalItemDiv('+calItem+'): calItem.what = '+calItem.what);
    var div=this.create.tag(Constants.Tags.DIV);
    var what=Common.Create.txt(calItem.what);
    var when=Common.Create.txt(calItem.when);
    var where=Common.Create.txt(calItem.where);
    var notes=Common.Create.txt(calItem.notes);
    div.add(what);
    div.add(Common.Create.txt('\n'));
    div.add(when);
    div.add(Common.Create.txt('\n'));
    div.add(where);
    div.add(Common.Create.txt('\n'));
    div.add(notes);
    return div;
  }

  ,getCalItemsByDay:function(dayOfMonth){
    ISPACES.log.debug(this.classId+'.getCalItemsByDay('+dayOfMonth+')');
    ISPACES.log.debug(this.classId+'.getCalItemsByDay(): this.entries.length = '+this.entries.length);
    var calItems=[];
    for(var i=0;i<this.entries.length;i++){
      var calItem=this.entries[i];
      //ISPACES.log.debug(this.classId+'.getCalItemsByDay('+dayOfMonth+'): calItem[\'what\'] = '+calItem['what']);
      //ISPACES.log.debug(this.classId+'.getCalItemsByDay('+dayOfMonth+'): calItem[\'day\'] = '+calItem['day']);
      if(calItem[YEAR]==this.year){
        if(calItem[MONTH]==this.month){
          if(calItem[DAY]==dayOfMonth){
            calItems.push(calItem);
          }
        }
      }
    }
    return calItems;
  }

  ,addEntry:function(o){
    this.entries.push(o);
  }

  //updateEntries:function(o,id){
  ,updateStore:function(id,o){
    ISPACES.log.alert(this.classId+'.updateStore:('+id+',o)');
    ISPACES.log.debug(this.classId+'.updateStore:('+id+',o): this.entries = '+this.entries.length);
    this.addEntry(o);
    ISPACES.log.debug(this.classId+'.updateStore:('+id+',o): this.entries = '+this.entries.length);
    var json=JSON.stringify(this.entries);
    ISPACES.log.alert(this.classId+'.updateStore:('+id+',o): json = '+json);
    ISPACES.log.debug(this.classId+'.updateStore:('+id+',o): this.store.set(id,json)');
    //this.store.set(id,json);
  }

  ,showEntries:function(){
    ISPACES.log.debug(this.classId+'.showEntries()');
    //var entries=this.store.get('entries');
    var _this=this;
    var entries=null;
    /*
    this.store.get(this.entriesName,function(ok,val){
      if(ok){
        //ISPACES.log.debug(this.classId+'.showEntries(): val = '+val);
        ISPACES.log.debug('.showEntries(): val = '+val);
        if(val){
          entries=val;
          ISPACES.log.debug('.showEntries(): entries = '+entries);
          _this.entries=JSON.parse(entries);
        }
      }
    });
    */
    ISPACES.log.debug(this.classId+'.showEntries(): entries = '+entries);

    if(entries){
      //var jsonArray=JSON.parse(entries);
      var jsonArray=eval(Common.parens(entries));
      this.entries=jsonArray;
      if(jsonArray){
        ISPACES.log.debug(this.classId+'.showEntries(): jsonArray = '+jsonArray);
        ISPACES.log.debug(this.classId+'.showEntries(): typeof jsonArray = '+typeof jsonArray);
        ISPACES.log.debug(this.classId+'.showEntries(): jsonArray.length = '+jsonArray.length);
      }
    }
    _this=null;
  }

  ,removeEntries:function(){
    ISPACES.log.debug(this.classId+'.removeEntries()');
    //this.store.remove(this.entriesName);
/*
    ISPACES.log.debug(this.classId+'.removeEntries(): this.entryCount = '+this.entryCount);
    for(var i=0;i<this.entryCount;i++){
      ISPACES.log.debug(this.classId+'.removeEntries(): entry'+i);
      this.store.remove('entry'+i,function(ok,val){
        if(ok){
          ISPACES.log.error(this.classId+'.removeEntries(): REMOVED entry'+i+', val = ' + val);
        }
      });
    }
    this.entryCount=0;
    this.store.set(this.entryCountName,(this.entryCount));
*/
  }

  ,drag:function(x,y,draggable){
    ISPACES.log.debug(this.id+'.drag('+x+', '+y+', '+draggable+')');

    var windowDiv=this.windowDiv;

    var windowXY=windowDiv._xy
      ,windowWH=windowDiv._wh
    ;

    if(!windowXY)windowXY=windowDiv._xy=Common.getXY(windowDiv);
    if(!windowWH)windowWH=windowDiv._wh=Common.getWH(windowDiv);

    var windowX=windowXY[0]
      ,windowY=windowXY[1]
      ,windowW=windowWH[0]
      ,windowH=windowWH[1]
    ;

    if(
      (x>windowX)
      &&(x<(windowX+windowW))
      &&(y>windowY)
      &&(y<(windowY+windowH))
    ){

      if(!this.isOver){
        this.isOver=true;
        this.mouseEnter(draggable);
      }

      return true; // handled!

    }else if(this.isOver){
      this.isOver=false;
    }

    return false; // not handled!
  }

  ,mouseEnter:function(draggable){
    ISPACES.log.debug(this.id+'.mouseEnter(draggable:'+draggable+')');

    draggable.rowBottom.hide();
    draggable.isOverDesktop=false;
  }

  ,destroySave:function(e){
    ISPACES.log.debug(this.classId+'.destroySave('+e+')');

    this.resizableWindow.hid(); // First off hide the window.. Calls ResizableWindow.windowDiv.hid()

    if(e)Common.stopEvent(e);
    var id=this.id;
    //new ISPACES.AsyncApply(this,this.destroy,null,50);
    new ISPACES.AsyncCall(this,this.destroy,50);

    /*
    var sb=new ISPACES.StringBuilder();
    sb.append("this.destroy()");
    //ISPACES.log.alert(this.classId+'.destroySave('+e+'): id = '+id);
    ISPACES.spaces.space.store.reset(id,sb.asString());
    */
  }

  ,destroy:function(){
    ISPACES.log.debug(this.classId+'.destroy()');

    this.resizableWindow.destroyWindow();
    ISPACES.spaces.space.removeAp(this);
    ISPACES.spaces.space.store.remove(this.id);

    for(var p in this){
      this[p]=null;
      delete this[p];
    }
  }

});

ISPACES.Calendar.start=function(json){
  ISPACES.log.debug('Calendar.start('+json+')');
  var o=eval(json);
  var calendar=new ISPACES.Calendar(o);
  ISPACES.spaces.space.addAp(calendar,o.alive);
};
