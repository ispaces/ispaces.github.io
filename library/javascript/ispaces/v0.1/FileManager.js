/*
 * Copyright © 2010, iSpaces. All Rights Reserved.
 * Unlicensed distribution, copying, reverse engineering, re-purposing or otherwise stealing of this code is a violation of copyright law.
 */
/**
 * FileManager
 *
 * http://en.wikipedia.org/wiki/Orthodox_file_manager#Orthodox_file_managers
 *
 * @author  Dermot Doherty
 * @version 0.1 - 8/22/2009 7:10PM - Initial Version.
 * @version 0.2 - 6/21/2010 11:48AM - Finished the UIs resizable components.
 * @version 0.3 - 6/28/2010 9:57AM - Added greyout layer and modal windows.
 * @version 0.4 - 8/3/2010 9:20PM - Added viewing of the local file system.
 * @version 0.5 - 10/26/2011 2:31AM - Added new multi panel and resizing/dragging system.
 */

/*
 * We not declare this class in an anonymous closure function, so we can add
 * some variables which are outside the scope of the object but necessary for
 * this class construction.
 * It is unnecessary that these variable be added to the global 'window' object.
 */
//(function(){

//Common.required("Files");
//Common.required("Roots");
//Common.required("Sounds");
//Common.required("ResizableWindow",true);

/* Experimental functionality to load multiple required classes.
var required=[
  "Files"
  ,"Roots"
  //,"Sounds"
  ,"ResizableWindow"
];
ISPACES.log.debug('required = '+required);
ISPACES.log.alert('required = '+required);
//Common.required(required,true);
*/

ISPACES.FileManager=function(o){
  ISPACES.log.debug(this.classId+'('+o+')');

  /*
   * Call the super constructor (Ap).
   */
  ISPACES.Ap.apply(this,arguments);

  this.id=this.classId+this.instanceId;

  //eval(this.id+'=this;'); // Set a direct reference to this object on the global namespace, so that the embedded applet can talk directly to it.
  ISPACES[this.id]=this; // Set a direct reference to this object on the global namespace, so that the embedded applet can talk directly to it.

  if(!ISPACES.languages.contains(this.classId))ISPACES.languages.getSubset(this.classId);

  this.windowTitle=ISPACES.JSONS.Titles[this.classId];
  //this.windowTitle=ISPACES.JSONS.Titles[this.classId]();

  this.headers=['Name','Size','Date'];
  this.panelCells=[];
  //this.selectedFiles=[];
  this.trs=[]; // Each file is represented by a table row. We create this array to keep a running list of selected rows when doing a multi-select.
  this.lis=[];
  //this.dropTargets=[];
  this.dropPanels=[];
  this.dropFolders=[];

  if(this.o.x)this.panelCount=0; // If this is a recreation, do not add any panels at startup.

  this.init();
  /*
  if(this.o.x){ // If this app is a recreation
    ISPACES.spaces.space.store.getThis(this);
  }else{
    this.init();
  }
  //*/

};

ISPACES.FileManager.prototype=new ISPACES.Ap();
ISPACES.FileManager.prototype.constructor=ISPACES.FileManager; // replenish the constructor

Common.extend(ISPACES.FileManager.prototype,{

  classId:"FileManager"
  ,WH:[888,480]
  ,debug:false
  ,DEFAULT_COLUMN_WIDTHS:[250,50,100]
  ,ext:'folder'
  ,grabberWidth:9
  ,borderWidth:8
  ,panelCount:2
  ,PROGRESS_WAIT:1000

  ,constants:{
    FSLASH:Constants.Characters.FSLASH
    ,EMPTY:Constants.Characters.EMPTY
    ,MOUSEDOWN:Constants.Events.MOUSEDOWN
    ,MOUSEUP:Constants.Events.MOUSEUP
    ,CLICK:Constants.Events.CLICK
    ,UL:Constants.Tags.UL
    ,COLON:Constants.Characters.COLON
  }

  ,init:function(){
    ISPACES.log.debug(this.id+'.init()');

    //this.apDiv=this.createAp().setClass(this.classId); // Create the application.
    this.apDiv=this.createAp().setClass('FM'); // Create the application.

    this.resizable={
      wi:this.wi.bind(this)
      ,hi:this.hi.bind(this)
    };

    var resizableWindow=this.resizableWindow;
    this.windowDiv=resizableWindow.windowDiv; // set a reference to the windowDiv. @see drag()
    resizableWindow.addResizables(); // Add the resizable handles to the window.
    resizableWindow.addAp(); // Add the app to the window.

    if(this.o.x){ // If this app is a recreation.

      ISPACES.spaces.space.store.getThis(this);

      resizableWindow.showCenter(); // Finally, show the window.

    }else{

      this.panelMouseDownBefore(this.panelCells[0]); // simulate the mousedown on the first panel to select it.

      this.wi(this.WH[0]),this.hi(this.WH[1]);

      this.setDimensions(); // A call to set the dimensions of the window after it has been built and added to the DOM.

      resizableWindow.showCenter(); // Finally, show the window.

      var xy=Common.getXY(this.apDiv);
      var wh=Common.getWH(this.apDiv);

      ISPACES.log.debug('xy = '+xy);
      ISPACES.log.debug('wh = '+wh);

      var x=new ISPACES.StringBuilder([
        'this.wh('
        ,wh
        ,'),this.xy('
        ,xy
        ,')'
      ]).asString();

      ISPACES.log.debug('x = '+x);

      new ISPACES.AsyncApply(
        ISPACES.spaces.space.store
        ,"resets"
        ,[this.id,x]
        ,1
      );

    }

    //resizableWindow.showCenter(); // Finally, show the window.

    /*
     * Call setDimensions a second time after the app has been added to the screen as the sizes seems to adjust slightly after the window has been shown.
     */
    //this.resetDimensions(); // A call to set the dimensions of the window after it has been built and added to the DOM.

    this.createContextMenus();
  }

  ,createAp:function(){
    ISPACES.log.debug(this.id+'.createAp()');

    /*
     * DOM
     */

    /*
     * Create the ResizableWindow Object and use it to create the titlebar element.
     */
    var create=this.create
    ,resizableWindow=new ISPACES.ResizableWindow(this)
    ,titlebar=resizableWindow.createTitlebar()
    ,titlebarCell=create.divCell(titlebar)
    ,titleRow=create.divRow(titlebarCell)
    ;


    /*
     * main div
     */
    var divMain=this.createMain()
    ,divMainCell=create.divCell(divMain).setClass('main-cell')
    ,divMainRow=create.divRow(divMainCell)
    ;

    /*
     * bottom menu
     */
    var bottomMenu=this.createBottomMenu()
    ,bottomMenuCell=create.divCell(bottomMenu)
    ,bottomTable=create.divTable(create.divRow(bottomMenuCell))
    ,bottomRow=create.divRow(bottomTable)
    ;

    var divTable=create.divTable([
      titleRow
      ,divMainRow
      ,bottomRow
    ]);

    /*
     * References
     */
    this.resizableWindow=resizableWindow;
    this.divMain=divMain;
    this.divTable=divTable;

    /*
     * Style
     */
    bottomTable.wip(100);
    bottomMenuCell.ow(Constants.Properties.HIDDEN);
    bottomMenuCell.maWi(1); // Strangely enough, this allows the bottom menu overflow:hidden to work
    var height=33;
    bottomRow.hi(height),bottomRow.maHi(height);
    divTable.wiphip(100);
    divTable.ow(Constants.Properties.HIDDEN);

    return create.div(divTable);
  }

  /*
   * This function gets called after the FileManager has been built and displayed on the screen.
   * It set the width & height of the file divs that hold the file trees so the resizing can occur.
   * It also creates the centering table for the modals.
   */
  ,setDimensions:function(){
    ISPACES.log.debug(this.id+'.setDimensions()');

    this.apDiv._wh=Common.getWH(this.apDiv);

    //ISPACES.log.debug('this.apDiv._wh = '+this.apDiv._wh);

    //var w=this.divMain.w=Common.getWidth(this.divMain);
    this.divMain.w=Common.getWidth(this.divMain);

    var w=this.apDiv._wh[0];

    this.adjustPercentageWidths(w);
    this.adjustPanels(w);

    /*
     * Get a panel, the first one.
     */
    var panelCell=this.panelCells[0];
    var fileDivRow=panelCell.fileDivRow;
    var fileDivRowWH=Common.getWH(fileDivRow);

    //ISPACES.log.debug('fileDivRowWH = '+fileDivRowWH);

  }

  ,resetDimensions:function(){
    ISPACES.log.debug(this.id+'.resetDimensions()');

    var windowWH=ISPACES.ui.getWindowWH();
    //ISPACES.log.debug('windowWH = '+windowWH);

    var apWH=this.apDiv._wh=Common.getWH(this.apDiv);
    //ISPACES.log.debug('apWH = '+apWH);

    //var w=this.divMain.w=Common.getWidth(this.divMain);
    this.divMain.w=Common.getWidth(this.divMain);
    //ISPACES.log.debug('this.divMain.w = '+this.divMain.w);

    var w=apWH[0];
    //ISPACES.log.debug('w = '+w);

    this.adjustPercentageWidths(w);
    this.adjustPanels(w);

    //var overflowXY=getOverflow(windowWH[0],windowWH[1]);
    //ISPACES.log.debug('overflowXY = '+overflowXY);

    //if(overflowXY[0]>0)this.ap.overflowX(overflowXY[0]);
    //if(overflowXY[1]>0)this.ap.overflowY(overflowXY[1]);
  }

  /*
  ,setDimensions:function(){
    //ISPACES.log.debug(this.id+'.setDimensions()');

    this.apDiv._wh=Common.getWH(this.apDiv);
    this.divMain._wh=Common.getWH(this.divMain);
    //this.bottomMenu.wh=Common.getWH(this.bottomMenu);

    //ISPACES.log.debug(this.id+'.setDimensions(): this.apDiv._wh[0] = '+this.apDiv._wh[0]+', this.apDiv._wh[1] = '+this.apDiv._wh[1]);
    //ISPACES.log.debug(this.id+'.setDimensions(): this.divMain._wh[0] = '+this.divMain._wh[0]+', this.divMain._wh[1] = '+this.divMain._wh[1]);
    //ISPACES.log.debug(this.id+'.setDimensions(): this.bottomMenu.wh[0] = '+this.bottomMenu.wh[0]+', this.bottomMenu.wh[1] = '+this.bottomMenu.wh[1]);

    //this.bottomMenu.hi(this.bottomMenu.wh[1]);
    //this.bottomMenu.maHi(this.bottomMenu.wh[1]);
    //this.bottomMenuCell.hi(this.bottomMenu.wh[1]);
    //this.bottomMenuCell.maHi(this.bottomMenu.wh[1]);

    this.greyout=this.createGreyout();
    this.resetGreyout();
    this.apDiv.add(this.greyout); // Add the greyout layer.

    this.centeringTable=this.createCenteringTable();
    this.resetCenteringTable();
    this.apDiv.add(this.centeringTable);

    //this.apDiv.hi(this.apDiv._wh[1]);
    //ISPACES.ui.unsetWH(this.apDiv); // After we reset the height of the addDiv, we unset it again so that it does not upset any resizing.
  }
  */

  ,recreate:function(a){
    ISPACES.log.debug(this.id+'.recreate('+a+')');

    var o                 // a single recreation array object. e.g [1,'ispaces'] or [2,'dropbox']
    ,x                    // the panel index
    ,i                    // the iterator index
    ,protocol             // the protocol
    ,z=a.length           // the length of recreations
    ,panelCell
    ,panelCells=[]
    ,ui=[]                // panelCells for the UI
    ,centerGrabber
    ;

    for(i=0;i<z;i++){

      o=a[i]
      ,x=o[0]
      ,protocol=o[1]
      ;

      ISPACES.log.debug('x = '+x+', protocol = '+protocol);

      if(i>0)ui.push(this.createCenterGrabber());

      panelCell=this.createPanel(x);
      panelCell.protocol=protocol; // Set the protocol as a property of the panelCell. @see save() & recreate()
      //ISPACES.log.debug('panelCell.i=x; Is this needed? or is this set in createPanel()?');
      //panelCell.i=x;
      ISPACES.log.debug('panelCell = '+panelCell);

      /*
      new ISPACES.AsyncApply(
        this
        ,"selectRoot"
        ,[panelCell,protocol]
        ,10
      );
      //*/

      //*
      new ISPACES.AsyncApply(
        this
        ,"recreateTree"
        ,[
          {
            protocol:protocol
            ,panelCell:panelCell
          }
        ]
        ,100
      );
      //*/

      ui.push(panelCell); // for the ui
      panelCells.push(panelCell); // for reference
    }

    this.panelCells=panelCells; // set a reference to the panelCells on the FileManager instance.

    //this.panelRow.addAll([centerGrabber,panelCell]);
    var panelRow=this.create.divRow(ui);
    this.panelRow=panelRow; // for panel insertion
    ISPACES.log.debug(this.id+'.recreate('+a+'): this.divTable = '+this.divTable);
    ISPACES.log.debug(this.id+'.recreate('+a+'): this.panelTable = '+this.panelTable);

    //this.divTable.replace(panelRow);
    this.panelTable.replace(panelRow);

    //this.setDimensions();
    this.resetWH();
    //this.wi(this.WH[0]);
    //this.hi(this.WH[1]);

  /*
        var w=Common.getWidth(this.divMain);
        this.resizingStarted(w);
        this.adjustPanels(w); // Adjust the panel widths after creating the new panel, but before adding it to the DOM.

        var panel0=this.panelCells[0];
        var fileDivRow=panel0.fileDivRow;
        var fileDivRowHeight=Common.getHeight(fileDivRow);
        ISPACES.log.debug('fileDivRowHeight = '+fileDivRowHeight);
        this.setFileDivHeights(fileDivRowHeight);
  */

      //li.ocButton(this.clickRoot.bind(this,li));

      /*
      // Create the tree and add it to the panel fileDiv.
      var tree=this.addTree(protocol);
      ISPACES.log.debug('tree = '+tree);

      if(tree){ // The addTree function returns null where there needs to be authentication.
        panelCell.fileDiv.replaceFirst(tree); // Replace the old file table with the new one.
      }
      */

      //this.setDimensions(); // A call to set the dimensions of the window after it has been built and added to the DOM.

      /*
      var o={
        protocol:protocol
        ,panelCell:panelCell
      };

      new ISPACES.AsyncApply(this,"recreateTree",[o],1);
      */

      /*
      // Select the root in the dropdown.
      //var rootUl=panelDrag.rootUl;
      //var li,lis=rootUl.lis;
      var ul=panelCell.rootUl;
      var li,lis=ul.lis;
      for(var j=0;j<lis.length;j++){
        li=lis[j];
        var protocolJ=li.protocol;
        ISPACES.log.debug('protocolJ = '+protocolJ);

        //this.clickRoot(li);

        //this.panelCell.protocol=protocol; // Set the protocol as a property of the panelCell. @see save() & recreate()

        if(protocol==protocolJ){
          li.setClass('selected');
        }else{
          li.setClass(this.constants.EMPTY);
        }

      }
      //*/

    //}
  }

  ,resetWH:function(){
    ISPACES.log.debug(this.id+'.resetWH()');

    this.setDimensions(); // A call to set the dimensions of the window here so the main area is not overflowed.

    var wh=Common.getWH(this.apDiv);
    ISPACES.log.debug('wh = '+wh);
    //ISPACES.log.debug('this.WH = '+this.WH);

    //this.wi(this.WH[0]),this.hi(this.WH[1]);
    this.wi(wh[0]),this.hi(wh[1]);
  }

  ,recreateTree:function(o){
    ISPACES.log.debug(this.id+'.recreateTree(o:'+o+')');

    //var protocol=o.protocol;
    var panelCell=o.panelCell;

    /*
    // Create the tree and add it to the panelCell fileDiv.
    //var tree=this.createTree(protocol);
    var tree=this.createTree(o);
    ISPACES.log.debug('tree = '+tree);

    if(tree){ // The createTree function returns null where there needs to be authentication.
      panelCell.fileDiv.replaceFirst(tree); // Replace the old file table with the new one.

      //this.selectRoot(panelCell,o.protocol);

    }
    */
    this.addTree(o);
    this.selectRoot(panelCell,o.protocol);
    /*
    new ISPACES.AsyncApply(
      this
      ,"selectRoot"
      ,[panelCell,o.protocol]
      ,1000
    );
    */
  }

  /*
  if(this.o.x){ // If this app is a recreation
    ISPACES.spaces.space.store.getThis(this);
  }else{
    this.init();
  }
  */

  ,selectRoot:function(panelCell,protocol){
    ISPACES.log.debug(this.id+'.selectRoot(panelCell:'+panelCell+', protocol:"'+protocol+'")');

    var ul=panelCell.rootUl
    ,li
    //,lis=ul.lis
    ,lis=ul.childNodes
    ,z=lis.length
    ,j
    ,liProtocol
    ;

    for(i=0;i<z;i++){

      li=lis[i]
      ,liProtocol=li.protocol;
      ;

      //ISPACES.log.debug('protocol = "'+protocol+'", liProtocol = "'+liProtocol+'"');

      //this.panelCell.protocol=protocol; // Set the protocol as a property of the panelCell. @see save() & recreate()

      if(protocol==liProtocol){
        li.setClass('selected');
        ul.li=li; // grab the selected list item, so we can reselect it after recreating the root select.
        //ul.isOpen=true;
        //this.clickRoot(li);
      }else{
        li.setClass(this.constants.EMPTY);
      }
    }
  }

  ,createMain:function(){
    ISPACES.log.debug(this.id+'.createMain()');

    var i
    ,a=[]
    ,panelCell
    ,z=this.panelCount
    ;

    for(i=0;i<z;i++){

      if(i>0)a.push(this.createCenterGrabber());

      panelCell=this.createPanel(i);
      panelCell.percentWidth=.5;

      a.push(panelCell); // for the ui
      this.panelCells.push(panelCell); // for reference
    }

    var panelRow=this.create.divRow(a)
    ,divTable=this.create.divTable(panelRow)
    ;

    /*
     * Set some local references.
     */
    this.panelRow=panelRow; // for new panel insertion
    //this.divTable=divTable; // for recreation of the panel row
    this.panelTable=divTable; // for recreation of the panel row

    return divTable;
  }

  ,createPanel:function(x){
    ISPACES.log.debug(this.id+'.createPanel('+x+')');

    var create=this.create;

    var panelCell=this.create.divCell().setClass('panel-cell');

    panelCell.i=x;
    panelCell.id=x;
    //panelCell.bo(Constants.Borders.BORE);
    //panelCell.ow(Constants.Properties.HIDDEN);
    panelCell.ow(Constants.Properties.VISIBLE);
    //panelCell.po(Constants.Properties.RELATIVE);
    //panelCell.miWi(1); // Strangely enough, this allows the bottom menu overflow:hidden
    //panelCell.maWi(1); // Strangely enough, this allows the bottom menu overflow:hidden
    //panelCell.wiphip(100);
    panelCell.hip(100);
    panelCell.pa('0px');

    /*
     * Set a mousedown event handler on the panel which gets captured first (i.e. the event capturing phase is set to true).
     * This is used to set focus on the panel when grabbing (mousedown) and dragging (mousemove) a file.
     */
    panelCell.addListener(
      this.constants.MOUSEDOWN
      ,this.panelMouseDownBefore.bind(this,panelCell)
      ,true // Set the event phase to the capturing phase, so that the mousedown event on the panel is processed here first.
    );

    panelCell.addListener(
      this.constants.MOUSEUP
      ,this.panelMouseUpBefore.bind(this,panelCell)
      ,true // Set the event phase to the capturing phase, so that the mousedown event on the panel is processed here first.
    );

    panelCell.addListener(
      Constants.Events.CONTEXTMENU
      ,this.showPanelContextMenu.bind(this)
    );

    this.addDropPanel(panelCell); // for dnd

    /*
    panelCell.sA('draggable','true');
    ISPACES.log.alert(this.id+'.createPanel('+x+'): panelCell.addEventListener(\'drop\',function(){');
    panelCell.addEventListener('drop',function(e){
      // this/e.target is current target element.
      ISPACES.log.debug('div.drop()');
      if(e.stopPropagation)e.stopPropagation(); // Stops some browsers from redirecting.
      e.preventDefault();
      var files=e.dataTransfer.files;
      for(var i=0,f;f=files[i];i++) {
        ISPACES.log.debug('div.drop(): f = '+f);
      }
    },false);
    //*/

    var panel=create.div().setClass('panel');
    //panel.bo(Constants.Borders.BOYE);
    panel.po(Constants.Properties.RELATIVE); // Constants.Properties.HIDDEN
    panel.wiphip(100);
    //panel.ba(Constants.Colors.FFF);
    //panel.miWi(1); // Strangely enough, this allows the bottom menu overflow:hidden
    //panel.maWi(1); // Strangely enough, this allows the bottom menu overflow:hidden
    panelCell.div=panel;
    panel.panel=panelCell;
    panel.panelCell=panelCell;

    /*
     * The topbarDiv is set as a property of the panel so it can add the position:absolute when doing a root select.
     */
    var topbarDiv=create.div();
    panelCell.topbarDiv=topbarDiv; /// Set a reference to the topbar on the topbarDiv. @see newPanel()

    var topbar=this.createTopbar(x,panelCell);
    //topbar.bo(Constants.Borders.BORE);
    topbarDiv.topbar=topbar;
    topbar.panel=panelCell; // Set the panel as a property of the toolbar for quick access.
    topbar.panelCell=panelCell; // Set the panel as a property of the toolbar for quick access.

    /*
    //var pathDiv=this.createPathDiv();
    var colDiv=this.createColumnHeaders();
    //var fileDiv=this.createFileDiv(o.root);
    var fileDiv=this.createFileDiv(o);
    //panelCell.pathDiv=pathDiv;
    //panelCell.colDiv=colDiv;
    //panelCell.fileDiv=fileDiv;
    */

    //* The first fileDiv creation happens after a root has been selected. Removing for now.
    //var fileDiv=this.createFileDiv(o);
    //var fileDiv=this.createFileDiv();
    //var fileDiv=create.divTable();
    //var fileDiv=create.divCell();
    var fileDiv=create.div().setClass('files');
    //fileDiv.di(Constants.Properties.INLINETABLE);
    //fileDiv.di(Constants.Properties.INLINEBLOCK);
    //fileDiv.bo(Constants.Borders.BOBL);
    fileDiv.hi(100);
    //fileDiv.hip(100);
    //fileDiv.wiphip(100);
    //fileDiv.ma('0');
    //fileDiv.alT();
    fileDiv.owX(Constants.Properties.HIDDEN);
    fileDiv.owY(Constants.Properties.AUTO);
    //fileDiv.ow(Constants.Properties.HIDDEN);
    panelCell.fileDiv=fileDiv;
    //ISPACES.log.debug(this.id+'.createPanel(): fileDiv ='+fileDiv);
    //*/

    /*
    fileDiv.addListener(
      'overflow'
      ,function(e){
        ISPACES.log.debug('fileDiv.overflow('+e+')');

        switch(e.detail){
          case 0:
            ISPACES.log.debug('The vertical scrollbar has appeared.');
            break;
          case 1:
            ISPACES.log.debug('The horizontal scrollbar has appeared.');
            break;
          case 2:
            ISPACES.log.debug('The horizontal and vertical scrollbars have both appeared.');
            break;
        }
      }
      ,false
    );
    *.

    /*
    fileDiv.addListener(
      Constants.Events.MOUSEWHEEL
      ,function(e){
        ISPACES.log.debug('mousewheel('+e+')');
        ISPACES.log.debug('e.wheelDelta = '+e.wheelDelta);
        ISPACES.log.debug('e.detail = '+e.detail);
        ISPACES.log.debug('e.axis = '+e.axis);

        var wheelData=e.detail?e.detail*-1:e.wheelDelta/40;
        ISPACES.log.debug('wheelData = '+wheelData);

        var raw=e.detail?e.detail:e.wheelDelta;
        var normal=e.detail?e.detail*-1:e.wheelDelta/40;
        ISPACES.log.debug('Raw Value: '+raw+", Normalized Value: "+normal);

        var delta = 0;
        if(e.wheelDelta){
          delta=e.wheelDelta/120;
        }else if(e.detail){
          delta=-e.detail/3;
        }
        ISPACES.log.debug('delta = '+delta);

        if(delta!=0){
          this.scrollTop=this.scrollTop-delta*10;
        }
        delta=0;

        Common.killEvent(e);

      }
      ,false
    );
    */

    /*
    fileDiv.addListener(
      'scroll'
      ,function(e){
        ISPACES.log.debug('scroll('+e+')');
      }
      ,false
    );
    */

    /*
    fileDiv.addListener(
      'underflow'
      ,function(e){
        ISPACES.log.debug('fileDiv.underflow('+e+')');

        switch(e.detail){
          case 0:
            ISPACES.log.debug('The vertical scrollbar has disappeared.');
            break;
          case 1:
            ISPACES.log.debug('The horizontal scrollbar has disappeared.');
            break;
          case 2:
            ISPACES.log.debug('The horizontal and vertical scrollbars have both disappeared.');
            break;
        }
      }
      ,false
    );
    */

    fileDiv.addListener(
      this.constants.MOUSEDOWN
      ,this.mouseDownFileDiv.bind(this)
      ,false
    );


    /*
    fileDiv.panel=panelCell; // Set the panel as a property of the fileDiv for quick access.
    fileDiv.hi(333);
    fileDiv.owX(Constants.Properties.HIDDEN);
    fileDiv.owY(Constants.Properties.AUTO);
    //fileDiv.boL('#88BBD6 2px solid');
    //fileDiv.boR('#88BBD6 1px solid');
    //fileDiv.boR('0px');
    */

    //*
    //var topbarDiv=create.div(topbar);
    topbarDiv.add(topbar);
    //topbarDiv.bo(Constants.Borders.BOOR);
    //topbarDiv.wip(100);
    //topbarDiv.hi(50);
    //topbarDiv.maHi(50);
    //topbarDiv.miHi(50);
    //topbarDiv.ow(Constants.Properties.VISIBLE);
    topbarDiv.po(Constants.Properties.RELATIVE);
    //topbarDiv.po(Constants.Properties.ABSOLUTE);
    //*/

    var topbarCell=create.divCell(topbarDiv);
    topbarCell.setClass('topbar-cell');
    //topbarCell.bo(Constants.Borders.BOYE);
    //topbarCell.po(Constants.Properties.RELATIVE);
    topbarCell.ow(Constants.Properties.VISIBLE);
    //topbarCell.po(Constants.Properties.ABSOLUTE);
    //topbarCell.hi(35);
    //topbarCell.hi(42);
    //topbarCell.hi(50);
    //topbarCell.maHi(50);
    //topbarCell.miHi(50);
    //topbarCell.wip(100);
    //topbarCell.hip(1);
    //topbarCell.paB('8px');
    //topbarCell.pa('3px');
    //topbarCell.pa('8px'); // We can either set the padding on the topbar cell itself or on the whole file panel below.
    //topbarCell.pa('8px 8px 0px 8px'); // We can either set the padding on the topbar cell itself or on the whole file panel below.
    var topbarRow=create.divRow(topbarCell);
    //topbarRow.po(Constants.Properties.RELATIVE);
    //*/
    //var topbarRow=create.divRow(topbarDiv);
    //topbarRow.hip(1);
    //topbarRow.hi(50);
    //topbarRow.maHi(50);
    //topbarRow.miHi(50);

    //var fileDivRow=create.divRow(fileDiv);
    var fileDivCell=create.divCell(fileDiv); // The first fileDiv creation happens after a root has been selected, so we no longer pass in the fileDiv.
    //var fileDivCell=create.divCell();

    //fileDivCell.pa('8px');
    //fileDivCell.maT('-20px');
    //fileDivCell.bo(Constants.Borders.BORE);
    panelCell.fileDivCell=fileDivCell;

    var fileDivRow=create.divRow(fileDivCell);
    fileDivRow.hip(100);
    //fileDivRow.ma('0');

    var divTableRows=create.divTable([
      topbarRow
      ,fileDivRow
    ]);

    //divTableRows.po(Constants.Properties.RELATIVE);
    //divTableRows.pa('8px');
    divTableRows.wiphip(100);
    //divTableRows.ma(Constants.Characters.ZERO);
    //divTableRows.pa(Constants.Characters.ZERO);
    //divTableRows.alCM();
    //divTableRows.bo(Constants.Borders.BOBL);
    panelCell.divTableRows=divTableRows;
    panelCell.fileDivRow=fileDivRow;

    /*
    //var div=create.div([
    //var div=create.divTable([
    var divCell=create.divCell([
      topbar
      //,toolbar
      //,pathDiv
      //,colDiv
      ,fileDiv
    ]);
    //divCell.bo(Constants.Borders.BOYE);
    divCell.pa('8px');
    //div.wip(100);
    //div.hip(100);
    divCell.wiphip(100);
    //div.di(Constants.Properties.INLINETABLE);
    //div.di(Constants.Properties.INLINEBLOCK);
    //*/
    var divCell=create.divCell(divTableRows);
    //divCell.bo(Constants.Borders.BOYE);
    //divCell.pa('8px'); // We can either set the padding on the whole cell, or on the individual cells above.
    divCell.wiphip(100);

    panel.add(divCell);

    /*
    panel.addAll([
      //topbar
      topbarRow
      //,toolbar
      //,pathDiv
      //,colDiv
      //,fileDiv
    ]);
    //*/


    /*
    // http://www.html5rocks.com/en/tutorials/dnd/basics/
    var dragSrcEl=null;
    panel.sA('draggable','true');
    panel.addEventListener('dragstart',function(e){
      ISPACES.log.debug('handleDragStart');
      this.style.opacity = '0.4';  // this / e.target is the source node.
      dragSrcEl=this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    },false);
    panel.addEventListener('dragenter',function(){ISPACES.log.debug('handleDragEnter')},false)
    panel.addEventListener('dragover',function(e){
      ISPACES.log.debug('handleDragOver');
      if (e.preventDefault)e.preventDefault(); // Necessary. Allows us to drop.
      e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
      return false;
    },false);
    panel.addEventListener('dragleave',function(e){ISPACES.log.debug('handleDragLeave')},false);
    panel.addEventListener('drop',function(e){ISPACES.log.debug('handleDrop')},false);
    panel.addEventListener('dragend',function(e){ISPACES.log.debug('handleDragEnd')},false);
    panel.addEventListener('drop',function(e){
      // this/e.target is current target element.
      ISPACES.log.debug('panel.drop()');
      if(e.stopPropagation)e.stopPropagation(); // Stops some browsers from redirecting.
      e.preventDefault();
      var files=e.dataTransfer.files;
      if(files){
        for(var i=0,f;f=files[i];i++) {
          ISPACES.log.debug('panel.drop(): f = '+f);
          ISPACES.log.debug('panel.drop(): f.name = '+f.name+', f.type = '+f.type+', f.size = '+f.size);
          ISPACES.log.debug("panel.drop(): f.name = "+f.name+", f.type = "+f.type+", f.size = "+f.size);
          ISPACES.log.debug("panel.drop(): f['name'] = "+f['name']+", f['type'] = "+f['type']+", f['size'] = "+f['size']);
          if(f.lastModifiedDate)ISPACES.log.debug('panel.drop(): f.lastModifiedDate.toLocaleDateString() = '+f.lastModifiedDate.toLocaleDateString());
        }
      }
      ISPACES.log.debug('panel.drop(): dragSrcEl = '+dragSrcEl);
      if(dragSrcEl){
        // Do not do anything if dropping the same column were dragging.
        if(dragSrcEl!=this){
          // Set the source columns HTML to the HTML of the columnwe dropped on.
          dragSrcEl.innerHTML = this.innerHTML;
          this.innerHTML = e.dataTransfer.getData('text/html');
        }
      }
      return false;
    },false);
    //*/

    panelCell.add(panel);

    return panelCell;
  }

  ,createCenterGrabber:function(){
    ISPACES.log.debug(this.id+'.createCenterGrabber()');

    var _this=this;

    var grabby=this.create.div().setClass('grabby');
    var div=this.create.divCell(grabby).setClass('center');

    var newLeftWidth,newRightWidth;

    /*
    var eventType;
    if(ISPACES.isTouchDevice){
      eventType='touchstart';
    }else{
      eventType=this.constants.MOUSEDOWN;
    }
    */

    div.addListener(

      //eventType
      //(ISPACES.isTouchDevice)?Constants.Events.TOUCHSTART:this.constants.MOUSEDOWN
      this.constants.MOUSEDOWN // can be mousedown or touchstart

      ,function(e){
        //ISPACES.log.debug(this.id+'.createCenterGrabber(): div.mouseDown('+e+')');
        //ISPACES.log.debug(_this.id+': div.'+eventType+'()');

        if(!_this.resizePanelFunction){

          //ISPACES.global.resizableObject=_this; // Global catch-all object.
          ISPACES.global.mouseUpObject=_this; // Global catch-all object.

          var mouseDownX=e.pageX;
          //ISPACES.log.debug("mouseDownX = "+mouseDownX);

          var panelLeft=this.previousSibling;
          //var leftWH=Common.getWH(panelLeft);
          var leftWidth=Common.getWidth(panelLeft);
          //ISPACES.log.debug("leftWH = "+leftWH);
          //ISPACES.log.debug("leftWidth = "+leftWidth);

          var panelRight=this.nextSibling;
          //var rightWH=Common.getWH(panelRight);
          var rightWidth=Common.getWidth(panelRight);
          //ISPACES.log.debug("rightWH = "+rightWH);
          //ISPACES.log.debug("rightWidth = "+rightWidth);

          // Important - Before resizing colums, the enclosing panelCells needs overflow:Hidden for the center colum resizing to work.
          panelLeft.ow(Constants.Properties.HIDDEN);
          panelRight.ow(Constants.Properties.HIDDEN);

          var fileDivLeft=panelLeft.fileDiv;
          var fileDivRight=panelRight.fileDiv;
          fileDivLeft.w=Common.getWidth(fileDivLeft);
          fileDivRight.w=Common.getWidth(fileDivRight);

          /*
           * When resizing using the center grabber, the topbarDiv width must be 100% so it resizes with the panel.
           */
          var topbarDivLeft=panelLeft.topbarDiv;
          var topbarDivRight=panelRight.topbarDiv;
          //ISPACES.log.debug(this.id+'.createCenterGrabber(): topbarDivLeft = '+topbarDivLeft);
          //ISPACES.log.debug(this.id+'.createCenterGrabber(): topbarDivRight = '+topbarDivRight);
          topbarDivLeft.po('relative');
          topbarDivLeft.wip(100);
          topbarDivRight.po('relative');
          topbarDivRight.wip(100);

          var fileDivRight=panelRight.fileDiv;
          fileDivLeft.w=Common.getWidth(fileDivLeft);
          fileDivRight.w=Common.getWidth(fileDivRight);

          var eventTypeMove;
          if(ISPACES.isTouchDevice){
            eventTypeMove='touchmove';
          }else{
            eventTypeMove=Constants.Events.MOUSEMOVE;
          }

          Common.addListener(
            document
            //,eventTypeMove
            ,Constants.Events.MOUSEMOVE
            ,_this.resizePanelFunction=function(e){

              var mouseX=Common.getMouseX(e);
              var mouseMovedX=(mouseX-mouseDownX);

              //ISPACES.log.debug("mouseX = "+mouseX);
              //ISPACES.log.debug("mouseMovedX = "+mouseMovedX);

              newLeftWidth=leftWidth+mouseMovedX,newRightWidth=rightWidth-mouseMovedX;
              //ISPACES.log.debug('newLeftWidth = '+newLeftWidth+', newRightWidth = '+newRightWidth);

              if(newLeftWidth<0){
                panelLeft.wi(0),panelLeft.maWi(0),fileDivLeft.wi(0); // maWi() allows the overflow to work.
                panelRight.wi(leftWidth+rightWidth),panelRight.maWi(leftWidth+rightWidth);
              } else if(newRightWidth<0){
                panelRight.wi(0),panelRight.maWi(0),fileDivRight.wi(0);
                panelLeft.wi(leftWidth+rightWidth),panelLeft.maWi(leftWidth+rightWidth);
              }else{
                panelLeft.wi(newLeftWidth),panelLeft.maWi(newLeftWidth),fileDivLeft.wi(fileDivLeft.w+mouseMovedX);
                panelRight.wi(newRightWidth),panelRight.maWi(newRightWidth),fileDivRight.wi(fileDivRight.w-mouseMovedX);
              }

            }
            ,false
          );

        } // if(!_this.resizePanelFunction)

        //Common.stopEvent(e); // Prevent the drag from doing a selection.
        Common.killEvent(e); // Prevent the drag from doing a selection.
        return false; // Prevent the mouse down from initiating a selection.
      }

      ,false

    );

    div.addListener(

      this.constants.MOUSEUP // mouseup or touchend

      ,function(e){
        //ISPACES.log.debug(this.id+'.createCenterGrabber(): div.mouseUp('+e+')');

        //ISPACES.log.debug('newLeftWidth = '+newLeftWidth+', newRightWidth = '+newRightWidth);

        var panelLeft=this.previousSibling;
        var panelRight=this.nextSibling;

        //ISPACES.log.debug('panelLeft = '+panelLeft);
        //ISPACES.log.debug('panelRight = '+panelRight);

        /*
        // Important - When done resizing columns, the enclosing panel needs overflow:visible for the relative positioning to work when draggin panelCells.
        panelLeft.ow(Constants.Properties.VISIBLE);
        panelRight.ow(Constants.Properties.VISIBLE);
        //*/

        var leftWidth=Common.getWidth(panelLeft);
        var rightWidth=Common.getWidth(panelRight);

        //ISPACES.log.debug("leftWidth = "+leftWidth);
        //ISPACES.log.debug("rightWidth = "+rightWidth);

        //var leftWH=Common.getWH(panelLeft);
        //var rightWH=Common.getWH(panelRight);

        //ISPACES.log.debug("leftWH = "+leftWH);
        //ISPACES.log.debug("rightWH = "+rightWH);

        panelLeft.w=leftWidth;
        panelRight.w=rightWidth;

        if(_this.resizePanelFunction){
          Common.removeListener(
            document
            ,Constants.Events.MOUSEMOVE
            ,_this.resizePanelFunction
            ,false
          );
          _this.resizePanelFunction=null;
        }
      }

      ,false
    );

    return div;
  }

  ,createFileDiv:function(o){
    ISPACES.log.debug(this.id+'.createFileDiv(o:'+o+')');
    //ISPACES.log.debug(this.id+'.createFileDiv()');

    //var div=this.create.tag(Constants.Tags.DIV).setClass('files');
    var div=this.create.div().setClass('files');

    /*
    var o={};
    o.filesDiv=div;
    //o.filesDiv.left=o.left; // This is so we can set the selected root in the UI @see createFileUl:function(root,path,fileMap,filesDiv).

    // Asyncronously add the file listing, so that the UI can continue to be shown.
    //var call=new ISPACES.AsyncApply(this,"addFileDiv",[div,o.root],3);
    //AsyncApply.exec(new ISPACES.AsyncApply(this,"addFileDiv",[o],3));
    //this.addFileDiv(o);
    */

    div.owX(Constants.Properties.HIDDEN);
    div.owY(Constants.Properties.AUTO);
    return div;
  }

  /*
   * The topbar contains the panel repositioning functionality.
   * @param x the id of this panel.
   * @param panel The panel being created is passed in here, so the drag handle can be added to it for reference.
   */
  ,createTopbar:function(x,panelCell){
    ISPACES.log.debug(this.id+'.createTopbar('+x+', panelCell:'+panelCell+')');

    var _this=this
    ,create=this.create
    ,divDrag=panelCell.div
    ,topbarDiv=panelCell.topbarDiv
    ;

    //ISPACES.log.debug('divDrag = '+divDrag);
    //ISPACES.log.debug('topbarDiv = '+topbarDiv);

    var o={
      topbarDiv:topbarDiv
      ,firstTime:true
    };

    //new ISPACES.AsyncApply(this,this.addRoots,[o],1); // Asyncronously add the root listing, so that the UI can continue to be built and shown.
    var rootUl=this.createRootUl(o);
    panelCell.rootUl=rootUl; // Set a reference to the rootUl on the panelCell. @see divTable.ocButton().
    //rootUl.bo(Constants.Borders.BORE);
    //rootUl.mdmu(function(e){Common.stopEvent(e)}); // prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler

    /*
     * Prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler.
     */
    rootUl.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
    );

    rootUl.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
    );

    var rootsCell=create.divCell(rootUl).setClass('roots-cell');
    //rootsCell.bo(Constants.Borders.BOBL);
    panelCell.rootsCell=rootsCell; // for root recreation

    //var spacerCell=create.divCell(create.txt(x));
    var spacerCell=create.divCell(create.txt(Constants.Characters.NBSP));
    //var spacerCell=create.divCell();
    //spacerCell.bo(Constants.Borders.BOBL);
    ISPACES.log.warn(this.id+'.createTopbar('+x+', panelCell:'+panelCell+'): temporary for development @see newPanel()');
    panelCell.dragCell=spacerCell; // temporary for development @see newPanel()


    /*
     * Refresh button
     */
    var divRefresh=create.div(create.txt(Common.char(84))).setClass('button') // 93, 84
    ,refreshCell=create.divCell(divRefresh).setClass('button-cell')
    ;

    //divRefresh.oc(function(){_this.refresh(x)});
    divRefresh.addListener(
      this.constants.CLICK // can be click or touchend
      ,this.refresh.bind(this,x)
    );

    // Prevent the mouse down event from propagating to the divTable.
    divRefresh.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
    );

    // Prevent the mouse up event from propagating to the divTable.
    divRefresh.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
    );

    /*
     * Close button
     */
    var divClose=create.div(create.txt(Common.char(73))).setClass('button')
    ,closeCell=create.divCell(divClose).setClass('button-cell')
    ;

    divClose.addListener(
      this.constants.CLICK // can be click or touchend
      ,this.closePanel.bind(this,panelCell)
    );

    // Prevent the mouse down event from propagating to the divTable.
    divClose.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
    );

    //divClose.mu(function(e){Common.stopEvent(e)}); // prevent the mouse up event from propagating to the divTable
    divClose.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
    );


    /*
     * New panel button
     */
    var divNewPanel=create.div(create.txt(Common.char(74))).setClass('button')
    ,newPanelCell=create.divCell(divNewPanel).setClass('button-cell')
    ;

    divNewPanel.addListener(
      this.constants.CLICK // can be click or touchend
      ,this.newPanel.bind(this,panelCell.i)
    );

    // prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler
    divNewPanel.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
    );

    divNewPanel.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
    );


    var buttonsRow=create.divRow([
      refreshCell
      ,closeCell
      ,newPanelCell
    ]);

    var buttonsTable=create.divTable(buttonsRow).setClass('buttons-table');

    var buttonsCell=create.divCell(buttonsTable).setClass('buttons-cell');

    var divRow=create.divRow([
      rootsCell
      ,spacerCell
      ,buttonsCell
    ]);


    var divTable=create.divTable(divRow).setClass('topbar');
    divTable.wip(100);

    divTable.panelCell=panelCell;
    divTable.div=divDrag;

    /*
     * Temporarily out - causing a problem when dragging panelCells using the top header.
     */
    /*
    divTable.ocButton(function(){ // Allow clicking the divTable to isOpen the root select.
      ISPACES.log.debug('divTable.ocButton()');
      //_this.clickPanelRoots(panelCell);
      var ul=panelCell.rootUl;
      var li=ul.fC();
      _this.clickRoot(li);
    });
    //*/

    var panelCells=this.panelCells;
    var divDragPositionStart,divDragPositionFinish;
    //var divWidths=[]; // The divTable.mu() handler needs this, so we declare it here.
    var touchEndX; // the touchend event does not have any touches to get the final x coordinates. We have to set an external variable that will be picked up by the mouseUp/touchend event.

    //panelCell.md(function(e){
    /*
    var eventType;
    if(ISPACES.isTouchDevice){
      eventType='touchstart';
    }else{
      eventType=this.constants.MOUSEDOWN;
    }
    */
    panelCell.addListener(
      //eventType
      //(ISPACES.isTouchDevice)?Constants.Events.TOUCHSTART:this.constants.MOUSEDOWN
      this.constants.MOUSEDOWN // can be mousedown or touchstart
      ,this.panelMouseDown.bind(this,panelCell)
    );

    panelCell.mouseUp=function(e){
      ISPACES.log.debug('panelCell.mouseUp('+e+')');

      var mouseDownX=panelCell.mouseDownX; // get the original mousedown position from the panelCell
      //ISPACES.log.debug('panelCell.mouseDownX = '+panelCell.mouseDownX);

      /* this = panelCell
      if(this.dragPanelFunction){
        ISPACES.log.debug("typeof this.dragPanelFunction = "+typeof this.dragPanelFunction);
        Common.removeListener(
          document
          ,Constants.Events.MOUSEMOVE
          ,this.dragPanelFunction
          ,false
        );
        this.dragPanelFunction=null;
      }
      //*/

      //ISPACES.log.debug("typeof _this.dragPanelFunction = "+typeof _this.dragPanelFunction);
      if(_this.dragPanelFunction){

        /*
        var eventTypeMove;
        if(ISPACES.isTouchDevice){
          eventTypeMove='touchmove';
        }else{
          eventTypeMove=Constants.Events.MOUSEMOVE;
        }
        Common.removeListener(document,eventTypeMove,_this.dragPanelFunction,false);
        */

        Common.removeListener(
          document
          ,Constants.Events.MOUSEMOVE
          ,_this.dragPanelFunction
        );
        _this.dragPanelFunction=null;


        //if(_this.draggingStarted)_this.draggingStarted=false;
        //if(this.draggingStarted)this.draggingStarted=false;

        //ISPACES.log.debug('panelCell.divDragPositionStart = '+panelCell.divDragPositionStart);
        //ISPACES.log.debug('panelCell.divDragPositionFinish = '+panelCell.divDragPositionFinish);

        var divDragPositionStart=panelCell.divDragPositionStart;
        var divDragPositionFinish=panelCell.divDragPositionFinish;

        //ISPACES.log.debug('divDragPositionStart = '+divDragPositionStart+', divDragPositionFinish = '+divDragPositionFinish);
        //ISPACES.log.debug('touchEndX = '+touchEndX);

        if(divDragPositionStart!=divDragPositionFinish){ // The div was moved to a new position.

          //ISPACES.log.info('The div was moved to a new position.');

          divDrag.position=divDragPositionFinish;

          /*
          //var mouseX=Common.getMouseX(e);
          var mouseX;
          if(ISPACES.isTouchDevice){
            //mouseX=e.touches[0].pageX;
            mouseX=touchEndX;
            //mouseX=touchEndX||startX;
            //mouseX=startX;
          }else{
            mouseX=e.pageX;
          }
          */
          var mouseUpX=e.pageX;
          //ISPACES.log.debug('mouseX = '+mouseX);

          var movedX=mouseUpX-mouseDownX;
          //ISPACES.log.debug('movedX = '+movedX);

          var divWidth=0;
          var endPos=0;

          if(divDragPositionStart<divDragPositionFinish){
            for(var i=divDragPositionStart;i<divDragPositionFinish;i++){
              //divWidth=divWidths[i];
              divWidth=_this.divWidths[i];
              divWidth+=_this.grabberWidth;
              endPos+=divWidth;
            }
          }else{
            for(var i=divDragPositionFinish;i<divDragPositionStart;i++){
              //divWidth=divWidths[i];
              divWidth=_this.divWidths[i];
              divWidth+=_this.grabberWidth;
              endPos-=divWidth;
            }
          }

          _this.moveTo(divDrag,endPos,movedX);

          //ISPACES.log.alert("divTable.mouseUp("+e+"): panelCell.ow("+Constants.Properties.HIDDEN+")");
          //panelCell.ow(Constants.Properties.HIDDEN);

        }else{ // The div was moved but not to a new position. Just restore it.

          //ISPACES.log.info('The div was moved but not to a new position. Just restore it.');

          /*
          //var mouseX=Common.getMouseX(e);
          var mouseX;
          if(ISPACES.isTouchDevice){
            //mouseX=e.touches[0].pageX;
            mouseX=touchEndX||startX;
          }else{
            mouseX=e.pageX;
          }
          */
          var mouseUpX=e.pageX;;
          //ISPACES.log.debug('mouseX = '+mouseX);

          var movedX=mouseUpX-mouseDownX;
          //ISPACES.log.debug('mouseDownX = '+mouseDownX+', mouseX = '+mouseX+', movedX = '+movedX);

          if(movedX<0)movedX=-movedX; // Sometimes the movedX position can be negative number, where we are moving a panel from right to left.

          if(movedX>0){ // Only reset the position if the drag panel actually moved.
            //_this.moveTo(divDrag,0,movedX);
            _this.moveHome(divDrag,movedX);
            //divDrag.rel(0); // Reset the div with a relative position.
            //divDrag.wiphip(100); // Reset the width/height of the div.
            divDrag.setClass('panel'); // Reset the className
            //panelCell.style.minWidth=this.constants.EMPTY; // Remove the min-width setting on the panelCell
            panelCell.style.minWidth=Constants.Characters.EMPTY; // Remove the min-width setting on the panelCell
          }

        } // if(divDragPositionStart!=divDragPositionFinish)

      } // if(_this.dragPanelFunction)
    };

    //panelCell.addListener(this.constants.MOUSEUP,panelCell.mouseUp,false);
    //panelCell.mu(panelCell.mouseUp);
    /*
    if(ISPACES.isTouchDevice){
      panelCell.addListener('touchend',panelCell.mouseUp,false); // touch
    }else{
      panelCell.addListener(this.constants.MOUSEUP,panelCell.mouseUp,false); // click
    }
    */
    panelCell.addListener(
      this.constants.MOUSEUP // can be mouseup or touchend
      ,panelCell.mouseUp
    );

    return divTable;
  }

  ,createBottomMenu:function(){
    ISPACES.log.debug(this.id+'.createBottomMenu()');

    /*
     * DOM
     */
    var create=this.create // local reference to the 'create' object for speed

    /*
     * Copy
     */
    ,buttonCopy=create.div(create.txt(ISPACES.getString('copy'))).setClass('button copy')
    ,copyCell=create.divCell(buttonCopy).setClass('button-cell')

    /*
     * Move
     */
    ,buttonMove=create.div(create.txt(ISPACES.getString('move'))).setClass('button move')
    ,moveCell=create.divCell(buttonMove).setClass('button-cell')

    /*
     * New Folder
     */
    ,buttonNewFolder=create.div(create.txt(ISPACES.getString('new folder'))).setClass('button new-folder')
    ,newFolderCell=create.divCell(buttonNewFolder).setClass('button-cell')

    /*
     * Delete
     */
    ,buttonDelete=create.div(create.txt(ISPACES.getString('delete'))).setClass('button delete')
    ,deleteCell=create.divCell(buttonDelete).setClass('button-cell')

    ,buttonRow=create.divRow([
      copyCell
      ,moveCell
      ,newFolderCell
      ,deleteCell
    ])

    ,buttonTable=create.divTable(buttonRow).setClass('button-table')

    ;

    /*
     * Style
     */
    /*
    //buttonCopy.di('table-cell');
    copyCell.alCM();
    copyCell.wip(1);

    //buttonMove.di('table-cell');
    moveCell.alCM();
    moveCell.wip(1);

    //buttonNewFolder.di('table-cell');
    newFolderCell.alCM();
    newFolderCell.wip(1);

    //buttonDelete.di('table-cell');
    deleteCell.alCM();
    deleteCell.wip(1);
    */

    buttonTable.wip(1);
    //buttonTable.bo(Constants.Borders.BORE);
    buttonTable.alCM();
    buttonTable.ow(Constants.Properties.HIDDEN);

    /*
     * Events
     */
    var CLICK=this.constants.CLICK;

    buttonCopy.addListener(CLICK,this.copy.bind(this));
    buttonMove.addListener(CLICK,this.move.bind(this));
    buttonNewFolder.addListener(CLICK,this.newFolder.bind(this));
    buttonDelete.addListener(CLICK,this.del.bind(this));

    /*
     * Prevent the mousedown/mouseup event from selecting the text on the button. Is there a better way? CSS = user-select:none
     */
    /*
    buttonCopy.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
      ,false
    );

    buttonCopy.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
      ,false
    );

    buttonMove.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
      ,false
    );

    buttonMove.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
      ,false
    );

    buttonNewFolder.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
      ,false
    );

    buttonNewFolder.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
      ,false
    );

    buttonDelete.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
      ,false
    );

    buttonDelete.addListener(
      this.constants.MOUSEUP
      ,function(e){Common.stopEvent(e)}
      ,false
    );
    */

    /*
     * Progress
     */
    /*
    var _this=this;
    var divProgress=this.create.div(this.create.txt('Progress')).setClass('button progress');
    //divProgress.oc(this.progress.bind(this));
    //divProgress.ocButton(this.del.bind(this));
    divProgress.addListener(
      this.constants.CLICK
      //,this.progress.bind(this)
      ,function(){

        ISPACES.log.debug('_this.progressCall = '+_this.progressCall);

        //if(!this.progressCall){
        //if(!_this.progressCall){
          //ISPACES.log.debug('this.progressCall=new ISPACES.AsyncCall()');
          //this.progressCall=new ISPACES.AsyncCall(
          _this.progressCall=new ISPACES.AsyncCall(
            //this
            _this
            ,"progress"
            //,this.progress
            //,_this.PROGRESS_WAIT // If after this.PROGRESS_WAIT seconds the copy is not completed (and this asynchronous call cancelled), call the progress function.
            ,0
          );
        //}

      }
      ,false
    );
    //divProgress.mdmu(function(e){Common.stopEvent(e)}); // prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler
    divProgress.di('table-cell');

    var progressCell=this.create.divCell(divProgress);
    progressCell.setClass('button-cell');
    progressCell.alCM();
    progressCell.wip(1);

    buttonRow.add(progressCell);
    //*/


    //return buttonTable;

    //var buttonCell=this.create.divCell(buttonTable);
    //buttonCell.wip(1);

    /*
    //var div=this.create.div(menuDivTable).setClass('bottom');
    var div=this.create.div(buttonTable).setClass('bottom');
    //div.bo(Constants.Borders.BOBL);
    div.alCM();

    return div;
    */
    return create.div(buttonTable).setClass('bottom');
  }


  /*
   * Actions
   */
  ,newPanel:function(
    x
    //,panel
  ){
    //ISPACES.log.debug(this.id+'.newPanel('+x+')');

    var panelCells=this.panelCells;
    //ISPACES.log.debug('panelCells.length = '+panelCells.length);

    //ISPACES.log.debug('this.panelRow.childNodes = '+this.panelRow.childNodes);
    //ISPACES.log.debug('this.panelRow.childNodes.length = '+this.panelRow.childNodes.length);
    //ISPACES.log.debug('typeof this.panelRow.childNodes = '+typeof  this.panelRow.childNodes);
    //ISPACES.log.debug('this.panelRow.getIndex(panel) = '+this.panelRow.getIndex(panel));

    //var indexOfPanel=this.panelRow.getIndex(panel);
    //ISPACES.log.debug('indexOfPanel = '+indexOfPanel);

    //var x=createRandomNumber(1000000);
    //var x=this.create.random();

    var position=x+1;
    //ISPACES.log.debug('position = '+position);

    var newPanel=this.createPanel(position);

    //this.panelCells.splice(div.panelCell.i,1); // remove the panel being dragged from the panelCells array
    panelCells.splice(position,0,newPanel); // add the panelCell being dragged at the new position

    var panelCell
    //,panelCells=this.panelCells
    ,z=panelCells.length
    ,a=[]
    ;

    var totalWidth=Common.getWidth(this.divMain);

    //ISPACES.log.debug('totalWidth = '+totalWidth);

    this.adjustPercentageWidths(totalWidth);
    /*
    var width=250;
    var newWidth=totalWidth-width;
    var percentage=newWidth/totalWidth

    ISPACES.log.debug('newWidth = '+newWidth);
    ISPACES.log.debug('percentage = '+percentage);
    */

    /*
    var w=Common.getWidth(this.divMain);
    this.resizingStarted(w);
    this.adjustPercentageWidths(w);
    this.adjustPanels(w);
    */

    var panelCell0=this.panelCells[0];
    var fileDivRow=panelCell0.fileDivRow;
    var fileDivRowWH=Common.getWH(fileDivRow);
    //ISPACES.log.debug('fileDivRowWH = '+fileDivRowWH);

/*
    //var divTableRows=panelCell.divTableRows;
    //var divTableRowsHeight=Common.getHeight(divTableRows);
    //ISPACES.log.debug(this.id+'.setDimensions(): divTableRowsHeight = '+divTableRowsHeight);
    var fileDivRow=panelCell.fileDivRow;
    //var fileDivRowHeight=Common.getHeight(fileDivRow);
    //ISPACES.log.debug(this.id+'.setDimensions(): fileDivRowHeight = '+fileDivRowHeight);
    //this.setFileDivHeights(fileDivRowHeight);

    //ISPACES.log.debug(this.id+'.setDimensions(): Common.getWH(panelCell.fileDivRow) = '+Common.getWH(panelCell.fileDivRow));
    //ISPACES.log.debug(this.id+'.setDimensions(): Common.getWH(panelCell.fileDivCell) = '+Common.getWH(panelCell.fileDivCell));

    //fileDivRowWH[0]=fileDivRowWH[0]-2; // We subtract 2 pixels from the width here so that the fileDiv does not overshoot the fileDivCell and the panel border remains visible.
    this.setFileDivWH(fileDivRowWH);

  ,setFileDivWH:function(wh){
    ISPACES.log.debug(this.id+'.setFileDivWH('+wh+')');

    var panelCell,fileDiv,panelCells=this.panelCells;

    for(var i=0;i<panelCells.length;i++){
      panelCell=panelCells[i];
      fileDiv=panelCell.fileDiv;
      fileDiv.wihi(wh[0],wh[1]);
      //fileDiv.wihi((wh[0]-1),wh[1]);
      //fileDiv.di(Constants.Properties.BLOCK);
    }
  }
*/

    for(var i=0;i<z;i++){

      panelCell=panelCells[i];

      var topbarDiv=panelCell.topbarDiv;
      var fileDiv=panelCell.fileDiv;

      //ISPACES.log.debug('panelCell = '+panelCell);
      //ISPACES.log.debug('panelCell.i = '+panelCell.i);
      //ISPACES.log.debug('topbarDiv = '+topbarDiv);
      //ISPACES.log.debug('panelCell.div = '+panelCell.div);
      //ISPACES.log.debug('fileDiv = '+fileDiv);
      //ISPACES.log.debug('Common.getWidth(panelCell) = '+Common.getWidth(panelCell));
      //ISPACES.log.debug('Common.getWidth(panelCell.div) = '+Common.getWidth(panelCell.div));
      //ISPACES.log.debug('Common.getWidth(fileDiv) = '+Common.getWidth(fileDiv));

      //var panelCellWidth=panelCell.panelWidth;
      var panelCellWidth=panelCell.w;
      //ISPACES.log.debug('panelCellWidth = '+panelCellWidth);

      if(panelCellWidth){ // If this panelCells width has been modified. @see centerGrabber

        //panelCellWidth=Math.round(((w*percentage)/100)*100);
        //panelCell.w=panelCellWidth;
        //panelCell.wi(panelCell.w),panelCell.maWi(panelCell.w);

        //topbarDiv.wi(panelCell.w);
        //topbarDiv.wi(panelCell.w),topbarDiv.maWi(panelCell.w);

        panelCellWidth=totalWidth/z;
        panelCell.w=panelCellWidth;

        panelCell.wi(panelCell.w),panelCell.maWi(panelCell.w);

        percentWidth=(panelCellWidth/totalWidth).toFixed(4); // toFixed(4) gives us better accuracy when adjust panel widths
        ISPACES.log.debug('percentWidth = '+percentWidth);

        panelCell.percentWidth=percentWidth;


      }else{

        panelCellWidth=totalWidth/z;
        panelCell.w=panelCellWidth;

        panelCell.wi(panelCell.w),panelCell.maWi(panelCell.w);
        //panelCell.bo('red 1px solid');

        percentWidth=(panelCellWidth/totalWidth).toFixed(4); // toFixed(4) gives us better accuracy when adjust panel widths
        ISPACES.log.debug('percentWidth = '+percentWidth);

        panelCell.percentWidth=percentWidth;

        //topbarDiv.wi(panelCell.w),topbarDiv.maWi(panelCell.w);
        //topbarDiv.po('relative');
        //topbarDiv.wip(100);
        //topbarDiv.maWi('');
        //topbarDiv.bo('red 1px solid');

      }

      //ISPACES.log.debug('panelCellWidth = '+panelCellWidth);

      fileDiv.wi((panelCell.w-7));
      //fileDiv.wi(panelCell.w),fileDiv.maWi(panelCell.w);

      //topbarDiv.wi(panelCell.w);
      //topbarDiv.wi(panelCell.w),topbarDiv.maWi(panelCell.w);
      //topbarDiv.wip(100),topbarDiv.maWi('');

      // Reset the panelCell.
      panelCell.i=i;
      panelCell.div.rel(0);
      panelCell.div.lt(0);
      panelCell.div.setClass('panel'); // Reset the className

      //var w=Common.getWidth(panel);
      //var w0=Math.round(((w*percentage)/100)*100);
      //ISPACES.log.debug('w = '+w+', w0 = '+w0);


      if(i==position){

        /*
        ISPACES.log.debug('panelCell.wi(171)');

        if(topbarDiv){
          ISPACES.log.debug('topbarDiv.po('+Constants.Properties.RELATIVE+')');
          topbarDiv.po(Constants.Properties.RELATIVE);
          topbarDiv.wip(100);
        }

        //panelCell.wi(171);
        panelCell.wi(171),panelCell.maWi(171);

        //panelCell.div.wi(171);
        */

        /*
        ISPACES.log.debug('fileDiv.wi(171)');
        fileDiv.wi(171);
        //fileDiv.wihi(wh[0],wh[1]);
        */
        var fileDiv=panelCell.fileDiv;
        fileDiv.hi(fileDivRowWH[1]);

      }else{

        //panelCell.wi(w0);
        //ISPACES.log.debug('panelCell.wi('+w0+')');


        //ISPACES.log.debug('panelCell.bo('+Constants.Borders.BORE+')');
        //panelCell.bo(Constants.Borders.BORE);
        //ISPACES.log.alert('panelCell.bo('+Constants.Borders.BORE+')');

        //ISPACES.log.debug('panelCell.div.bo('+Constants.Borders.BOOR+')');
        //panelCell.div.bo(Constants.Borders.BOOR);
        //ISPACES.log.alert('panelCell.div.bo('+Constants.Borders.BOOR+')');

        //ISPACES.log.debug('topbarDiv.div.bo('+Constants.Borders.GREEN+')');
        //topbarDiv.bo(Constants.Borders.GREEN);
        //ISPACES.log.alert('topbarDiv.div.bo('+Constants.Borders.GREEN+')');

        /*
        if(topbarDiv){

          ISPACES.log.debug('topbarDiv.wi('+w0+')');
          topbarDiv.wi(w0);
          //ISPACES.log.alert('topbarDiv.wi('+w0+')');

          ISPACES.log.debug('topbarDiv.po('+Constants.Properties.RELATIVE+')');
          topbarDiv.po(Constants.Properties.RELATIVE);
          //ISPACES.log.alert('topbarDiv.po('+Constants.Properties.RELATIVE+')');

          ISPACES.log.debug('topbarDiv.wip(100)');
          topbarDiv.wip(100);
          //ISPACES.log.alert('topbarDiv.wip(100)');

          //topbarDiv.wi(w0);
          //topbarDiv.wip(100);
          //topbarDiv.po(Constants.Properties.RELATIVE);
        }
        */


        //ISPACES.log.debug('panelCell.wi('+w0+')');
        //panelCell.wi(w0);
        //panelCell.wi(w0),panelCell.maWi(w0);

        //ISPACES.log.alert('panelCell.wi('+w0+')');
        //,panelCell.miWi(w0);
        //,panelCell.maWi(w0);
        //panelLeft.wi(newLeft),panelLeft.maWi(newLeft),fileDivLeft.wi(fileDivLeft.w+mouseMovedX);
        //panelRight.wi(newRight),panelRight.maWi(newRight),fileDivRight.wi(fileDivRight.w-mouseMovedX);


        //ISPACES.log.debug('panelCell.div.wi('+w0+')');
        //panelCell.div.wi(w0);
        //panelCell.div.wi(w0),panelCell.div.maWi(w0);
        //ISPACES.log.alert('panelCell.div.wi('+w0+')');

        /*
        ISPACES.log.debug('fileDiv.bo('+Constants.Borders.BORE+')');
        fileDiv.bo(Constants.Borders.BORE);
        ISPACES.log.alert('fileDiv.bo('+Constants.Borders.BORE+')');

        fileDiv.wip(100);

        ISPACES.log.debug('Common.getWidth(fileDiv) = '+Common.getWidth(fileDiv));

        var fileDivW=Common.getWidth(fileDiv);
        ISPACES.log.debug('fileDivW = '+fileDivW);

        //ISPACES.log.debug('fileDiv.wi('+w0+')');
        ISPACES.log.debug('fileDiv.wi('+fileDivW+')');
        fileDiv.wi(fileDivW);
        */

        //ISPACES.log.alert('fileDiv.wi('+w0+')');
        //fileDiv.wi(w0);

        //var fileDivLeft=panelLeft.fileDiv;
        //var fileDivRight=panelRight.fileDiv;

        //panelCell.fileDiv.wi(w0);
        //panelCell.fileDiv.wip(100);
        //panelCell.fileDiv.miWi(w0);
        //panelCell.fileDiv.maWi(w0);


        //panelCell.topbarDiv.wip(100),panelCell.topbarDiv.miWi(''),panelCell.topbarDiv.maWi('');
        //panelCell.topbarDiv.wi(w0),panelCell.topbarDiv.miWi(w0),panelCell.topbarDiv.maWi(w0);
      }

      /*
      //panelCell.wi('');
      //panelCell.wi(''),panelCell.miWi(''),panelCell.maWi('');
      //panelCell.wip(100),panelCell.miWi(''),panelCell.maWi('');

      //panelCell.div.wi('');
      //panelCell.div.wi(''),panelCell.div.miWi(''),panelCell.div.maWi('');
      //panelCell.div.wiphip(100),panelCell.div.miWi(''),panelCell.div.maWi('');

      //panelCell.fileDiv.wi(''),panelCell.fileDiv.miWi(''),panelCell.fileDiv.maWi('');
      //panelCell.fileDiv.wip(100),panelCell.fileDiv.miWi(''),panelCell.fileDiv.maWi('');

      //panelCell.topbarDiv.wi(''),panelCell.topbarDiv.miWi(''),panelCell.topbarDiv.maWi('');
      //panelCell.topbarDiv.wip(100),panelCell.topbarDiv.miWi(''),panelCell.topbarDiv.maWi('');

      //var topbarDiv=panelCell.topbarDiv;
      //if(topbarDiv){
      //  //topbarDiv.alL();
      //  topbarDiv.po(Constants.Properties.RELATIVE);
      //  //topbarDiv.di(Constants.Properties.TABLECELL);
      //  //topbarDiv.rel(0,0);
      //  topbarDiv.wip(100);
      //  topbarDiv.topbar.setClass('topbar');

      //  //var w=Common.getWidth(topbarDiv);
      //  //ISPACES.log.debug(this.id+'.clickRoot('+li+'): w = '+w);
      //  //topbarDiv.wi(w);
      //  //topbarDiv.po(Constants.Properties.ABSOLUTE);
      //  //topbar.setClass('topbaropen');
      //}

      panelCell.ow(Constants.Properties.HIDDEN);
      //panelCell.style.minWidth=this.constants.EMPTY; // Remove the min-width setting on the panel
      //panelCell.dragCell.replaceFirst(this.create.txt(i)); // temporary for development
      */

      if(i>0)a.push(this.createCenterGrabber());

      a.push(panelCell);
    }

    //this.setDimensions();

    // Recreate the panel row and replace it.
    var panelRow=this.create.divRow(a);
    this.divMain.replace(panelRow,this.panelRow);
    this.panelRow=panelRow;

    /*
    var centerGrabber=this.createCenterGrabber();
    //this.panelRow.add(centerGrabber);
    //ISPACES.log.debug('centerGrabber = '+centerGrabber);

    //var newPanel=this.createPanel(x);
    var newPanel=this.createPanel(x+1);
    ISPACES.log.debug('newPanel = '+newPanel);
    */

    //this.adjustPanels(); // Adjust the panel widths after creating the new panel, but before adding it to the DOM.

    /*
    //newPanel.centerGrabber=centerGrabber;
    //this.panelRow.add(newPanel);
    //this.panelRow.insertAfter(newPanel,panelCell);
    //this.panelRow.insertAfter(newPanel,panelCell.centerGrabber);
    this.panelRow.insertAfter([centerGrabber,newPanel],panelCell);
    */

    /*
    var panelAtIndex=this.panelCells[x];
    ISPACES.log.debug('panelAtIndex = '+panelAtIndex);
    this.panelRow.insertAfter([centerGrabber,newPanel],panelAtIndex);

    ISPACES.log.debug('this.panelCells.length = '+this.panelCells.length);
    this.panelCells.splice((x+1),0,newPanel);
    ISPACES.log.debug('this.panelCells.length = '+this.panelCells.length);

    // Reset the panel index.
    for(var i=0;i<this.panelCells.length;i++){
      ISPACES.log.debug('this.panelCells['+i+'] = '+this.panelCells[i]);
      panelCell=this.panelCells[i];
      ISPACES.log.debug('panelCell.i = '+panelCell.i);
      panelCell.i=i;
      //panelCell.dragCell.replaceFirst(this.create.txt(i)); // temporary for development
    }

    var w=Common.getWidth(this.divMain);
    this.resizingStarted(w);
    this.adjustPanels(w); // Adjust the panel widths after creating the new panel, but before adding it to the DOM.

    var panelCell=this.panelCells[0];
    var fileDivRow=panelCell.fileDivRow;
    var fileDivRowHeight=Common.getHeight(fileDivRow);
    ISPACES.log.debug(this.id+'.setDimensions(): fileDivRowHeight = '+fileDivRowHeight);
    this.setFileDivHeights(fileDivRowHeight);
    */

    //this.save();
  }

  ,save:function(){
    ISPACES.log.debug(this.id+'.save()');

    //ISPACES.log.debug('this.panelCells.length = '+this.panelCells.length);

    var i
    ,panelCells=this.panelCells
    ,z=this.panelCells.length
    ,a=[]
    ;

    /*
     * Create the JSON to be saved for each panelCell.
     * E.g.
     *    [
     *      [1,'ispaces']
     *      ,[2,'c']
     *      ,[3,'dropbox']
     *    ]
     *
     * Todo: Make this native forEach() or collect().
     */
    for(i=0;i<z;i++){
      panelCell=panelCells[i];
      //ISPACES.log.debug('panelCell.i = '+panelCell.i);
      //a[i]=panelCell.i;
      a[i]=[panelCell.i,panelCell.protocol];
    }

    var json=JSON.stringify(a);
    //ISPACES.log.debug('json = '+json);

    var sb=new ISPACES.StringBuilder([
      "this.recreate("
      ,json
      ,Constants.Characters.RIGHTPAREN
    ]);
    //ISPACES.log.debug('sb.asString() = '+sb.asString());

    ISPACES.spaces.space.store.reset(this.id,sb.asString());
  }

  ,closePanel:function(panelCell){
    ISPACES.log.debug(this.id+'.closePanel(panelCell:'+panelCell+')');

    panelCell=panelCell||this.panelCell; // just in case there is no panel passed in, like when closing a panel from a context menu.

    this.panelCells.remove(panelCell); // remove the panelCell from the array of panelCells

    //*
    if(this.panelCells.length==0){
      this.destroySave();
      return;
    }
    //*/

    // Grab the center grabber before removing the panelCell from the DOM.
    var centerGrabber=panelCell.previousSibling;
    if(!centerGrabber)centerGrabber=panelCell.nextSibling;

    //panelCell.rm();
    this.panelRow.remove(panelCell); // remove the panelCell from the DOM

    //centerGrabber.rm(); // The last panelCell does not have any center grabbers.
    this.panelRow.remove(centerGrabber); // remove the centerGrabber from this.panelRow

    //var w=Common.getWidth(this.divMain);
    //var w=this.divMain.w=Common.getWidth(this.divMain);
    //this.divMain.w=Common.getWidth(this.divMain);
    var wh=this.apDiv._wh;
    if(!wh)wh=this.apDiv._wh=Common.getWH(this.apDiv);
    //ISPACES.log.debug('wh = '+wh);
    var w=wh[0];

    this.adjustPercentageWidths(w);
    this.adjustPanels(w);
    //this.adjustPanels(); // Adjust the panelCell widths after removing it from the DOM.
  }

  /*
   * Set the starting width and measure each of the panelCells.
   * @see adjustPanels()
   * NOTE: We are not allowing for the center grabbers when calculating the percentage width of the panelCells.
   */
  ,resizingStarted:function(w){
    //ISPACES.log.debug(this.id+".resizingStarted("+w+")");

    this.adjustPercentageWidths(w);
    this.getFileDivHeights();
  }

  ,resizingStopped:function(){
    ISPACES.log.debug(this.id+'.resizingStopped()');

  //  this.wh=Common.getWH(this.divMain);
    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }

  /*
  ,draggingStarted:function(){
    //ISPACES.log.debug(this.id+'.draggingStarted()');
  }
  */

  ,draggingStopped:function(){
    ISPACES.log.debug(this.id+'.draggingStopped()');

    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }

  ,getFileDivHeights:function(){
    ISPACES.log.debug(this.id+'.getFileDivHeights()');

    this.height=Common.getHeight(this.divMain);
    //ISPACES.log.debug('this.height = '+this.height);

    /*
    var panelCell=this.panelCells[0];
    var fileDivRow=panelCell.fileDivRow;
    var fileDivRowHeight=Common.getHeight(fileDivRow);
    ISPACES.log.debug(this.id+'.getFileDivHeights(): fileDivRowHeight = '+fileDivRowHeight);
    this.fileDivRowHeight=fileDivRowHeight;
    */

    var panelCell
    ,fileDiv
    ,panelCells=this.panelCells
    ;

    for(var i=0;i<panelCells.length;i++){
      panelCell=panelCells[i];
      fileDiv=panelCell.fileDiv;
      var fileDivHeight=Common.getHeight(fileDiv);
      //ISPACES.log.debug(this.id+'.getFileDivHeights(): fileDivHeight = '+fileDivHeight);
      fileDiv.h=fileDivHeight;
    }
  }

  ,setFileDivHeights:function(h){
    ISPACES.log.debug(this.id+'.setFileDivHeights('+h+')');

    var panelCell
    ,fileDiv
    ,panelCells=this.panelCells
    ,i
    ,z=panelCells.length
    ;

    for(i=0;i<z;i++){

      panelCell=panelCells[i]
      ,fileDiv=panelCell.fileDiv
      ;

      //ISPACES.log.debug('fileDiv.hi('+h+')');
      fileDiv.hi(h);
      fileDiv.di(Constants.Properties.BLOCK);
    }
  }

  ,setFileDivWH:function(wh){
    ISPACES.log.debug(this.id+'.setFileDivWH('+wh+')');

    var panelCell
    ,fileDiv
    ,panelCells=this.panelCells
    ,i
    ,z=panelCells.length
    ;

    for(i=0;i<z;i++){

      panelCell=panelCells[i]
      ,fileDiv=panelCell.fileDiv
      ;

      //ISPACES.log.debug('fileDiv.wihi('+wh+')');
      fileDiv.wihi(wh[0],wh[1]);
      //fileDiv.wihi((wh[0]-1),wh[1]);
      //fileDiv.di(Constants.Properties.BLOCK);

      //fileDiv._wh=wh; // set the wh as a property of the fileDiv. @see resetPanels() - does nto work - wh[1] = 0
    }
  }

  ,wi:function(w){
    //ISPACES.log.debug(this.id+'.wi('+w+')');

    //this.divMain.wi(w);
    //this.divTable.wi(w);
    //this.divTable.wi(w);

    this.adjustPanels(w);

    this.apDiv.wi(w);
  }

  ,hi:function(h){
    //ISPACES.log.debug(this.id+'.hi('+h+')');

    /*
    var dimensions=this.dimensions;
      titlebarWH:titlebarWH
      ,tabsMenuWH:tabsMenuWH
      ,navMenuWH:navMenuWH
    };
    var barHeights=(titlebarWH[1]+navMenuWH[1]+tabsMenuWH[1]);
    ISPACES.log.debug('barHeights = '+barHeights);
    */

    this.barHeights=66; // temporary, this should be calculated

    //*
    var divMainH=h-this.barHeights;
    //ISPACES.log.debug('divMainH = '+divMainH);
    if(divMainH>=0){
      //ISPACES.log.debug('this.divMain.hi('+divMainH+')');
      this.divMain.hi(divMainH);
    }
    //*/

    this.setFileDivHeights(divMainH-33); // temporary, this should be calculated

    this.apDiv.hi(h);
  }

  ,adjustHeight:function(h){
    ISPACES.log.debug(this.id+'.adjustHeight('+h+')');

    /*
    if(!h){
      h=Common.getHeight(this.apDiv);
      ISPACES.log.debug('h = '+h);
    }

    var bottomMenu=33;
    h-=bottomMenu;
    ISPACES.log.debug('h = '+h);

    var borderTop=5;
    h-=borderTop;
    ISPACES.log.debug('h = '+h);
    */
    h-=38;

    /*
     * Adjust the divMain height after subtracting the ...
     */
    //ISPACES.log.debug('this.divMain.hi('+h+')');
    this.divMain.hi(h);

    this.adjustFileDivHeights(h);
  }

  ,adjustFileDivHeights:function(h){
    ISPACES.log.debug(this.id+'.adjustFileDivHeights('+h+')');

    var adjustment=h-this.height;
    //ISPACES.log.debug('adjustment = '+adjustment);

    var panelCell
    ,fileDiv
    ,panelCells=this.panelCells
    ,i
    ,z=panelCells.length
    ;

    for(i=0;i<z;i++){

      panelCell=panelCells[i]
      ,fileDiv=panelCell.fileDiv
      ;

      //ISPACES.log.debug('fileDiv.hi('+(fileDiv.h+adjustment)+')');
      //fileDiv.hi(fileDiv.h+adjustment);
      ISPACES.log.debug('fileDiv.hi('+(fileDiv.h)+')');
      fileDiv.hi(fileDiv.h);

    }
  }

  ,adjustPercentageWidths:function(w){
    ISPACES.log.debug(this.id+'.adjustPercentageWidths('+w+')');

    var panelCell
    ,panelWidth
    ,percentWidth
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ;

    //ISPACES.log.debug('z = '+z);
    //ISPACES.log.debug('((z-1)*this.grabberWidth) = '+((z-1)*this.grabberWidth));
    //w-=((z-1)*this.grabberWidth); // Adjust the width for the center grabbers

    //var grabberWidth=(z-1)*9+(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    var grabberWidth=(z-1)*this.grabberWidth+(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //ISPACES.log.debug('grabberWidth = '+grabberWidth);

    w-=grabberWidth; // Adjust the width for the center grabbers.
    //ISPACES.log.debug('w = '+w);

    //ISPACES.log.debug(this.id+'.adjustPercentageWidths('+w+')');

    for(var i=0;i<z;i++){

      panelCell=panelCells[i];

      panelCell.ow(Constants.Properties.HIDDEN);

      /*
      panelWidth=Common.getWidth(panelCell);
      ISPACES.log.debug('panelWidth = '+panelWidth);
      percentWidth=panelWidth/w;
      percentWidth=(panelWidth/w).toFixed(2);
      ISPACES.log.debug('percentWidth = '+percentWidth);
      //*/

      panelWidth=Common.getWidth(panelCell);
      //ISPACES.log.debug('panelWidth = '+panelWidth);

      //percentWidth=(panelWidth/w);
      percentWidth=(panelWidth/w).toFixed(4); // toFixed(4) gives us better accuracy when adjust panel widths
      //percentWidth=((panelWidth/w)*100).toFixed(2);
      //ISPACES.log.debug('percentWidth = '+percentWidth);

      panelCell.percentWidth=percentWidth;
    }
  }

  /*
   * Adjust the panelCells using their percentage widths.
   *
   * Since the adjustment is calculated by percentage, the sum of the calculated width may not exactly equal the divMain width.
   * For a tighter implementation, adjust the last panel based on the remainder.
   */
  ,adjustPanels:function(w){
    ISPACES.log.debug(this.id+'.adjustPanels('+w+')');

    //ISPACES.log.debug('Common.getWidth(this.apDiv) = '+Common.getWidth(this.apDiv));
    //ISPACES.log.debug('Common.getWidth(this.divMain) = '+Common.getWidth(this.divMain));
    //ISPACES.log.debug('Common.getWidth(this.panelRow) = '+Common.getWidth(this.panelRow));

    if(!w){
      //w=Common.getWidth(this.divMain);
      w=Common.getWidth(this.apDiv);
      //ISPACES.log.debug('w = '+w);
    }

    var panelCell
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ,i
    ;

    //w-=((z-1)*8); // Adjust the width for the center grabbers.
    //var grabberWidth=(z-1)*9+(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //var grabberWidth=(z-1)*9; // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    var grabberWidth=(z-1)*this.grabberWidth; // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //ISPACES.log.debug('grabberWidth = '+grabberWidth);

    //var borderWidth=(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    var borderWidth=(this.borderWidth*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //ISPACES.log.debug('borderWidth = '+borderWidth);

    w-=borderWidth; // Adjust the width for the center grabbers.
    //ISPACES.log.debug('w = '+w);

    /*
     * Adjust the divMain width after subtracting the border widths.
     */
    //ISPACES.log.debug('this.divMain.wi('+w+')');
    this.divMain.wi(w);

    w-=grabberWidth; // Adjust the width for the center grabbers.
    //ISPACES.log.debug('w = '+w);

    //var totalNewWidth=0;

    for(i=0;i<z;i++){

      panelCell=panelCells[i];

      var percentWidth=panelCell.percentWidth;
      //ISPACES.log.debug('percentWidth = '+percentWidth);

      var newWidth=Math.round(w*percentWidth);
      //ISPACES.log.debug('newWidth = '+newWidth);

      //totalNewWidth+=newWidth;

      //ISPACES.log.debug('panelCell.wi('+newWidth+'),panelCell.maWi('+newWidth+')');
      panelCell.wi(newWidth),panelCell.maWi(newWidth); // maWi() allows the overflow to work.
      //panelCell.wi(newWidth),panelCell.maWi(newWidth),panelCell.miWi(newWidth); // maWi() allows the overflow to work.

      /*
       * Also set the width of the fileDiv so the overflow works when resizing panelCells.
       * We subtract 2 pixels from the width here so that the fileDiv does not overshoot the fileDivCell and the panel border remains visible.
       */
      panelCell.fileDiv.wi(newWidth);
      //panelCell.fileDiv.wi((newWidth-2));
      //panelCell.fileDiv.wi((newWidth-1));

    }

    //ISPACES.log.debug('totalNewWidth = '+totalNewWidth);
  }

  /*
   * Adjust the panelCells from their current width, which is trickier than just dividing the width up equally... panelWidth=parseInt(w/count);
   * The problem here is when one of the panelCells reaches a width of zero. The other panelCells have to continue getting smaller.
   */
  /*
  ,adjustPanelsBak:function(w){
    ISPACES.log.debug(this.id+'.adjustPanels('+w+')');

    if(!w)w=Common.getWidth(this.divMain);

    var resize=this.w-w;
    ISPACES.log.debug('this.w = '+this.w+', resize = '+resize);

    //var panelCells=this.panelCells,count=panelCells.size();
    var panelCells=this.panelCells,count=Common.size(panelCells);
    ISPACES.log.debug('count = '+count);

    var panelResize=Math.round(resize/count);
    ISPACES.log.debug('panelResize = '+panelResize);

    //var modulus=resize%count;
    //ISPACES.log.debug('modulus = '+modulus);
    //ISPACES.log.debug('count = '+count+', modulus = '+modulus);

    var panelCell,panelWidth;
    var totalWidth=0;

    for(var p in panelCells){

      panelCell=panelCells[p];

      panelWidth=panelCell.w;
      totalWidth+=panelWidth;
      ISPACES.log.debug("panelCell.id = "+panelCell.id+", panelWidth = "+panelWidth+", panelResize = "+panelResize);
      newPanelWidth=panelWidth-panelResize;

      if(newPanelWidth<0){ // If the panel width reaches zero, we have to readjust.
        count--;
        panelResize=Math.round(resize/count);
      }

      ISPACES.log.debug('panelCell.wi('+newPanelWidth+')');
      panelCell.wi(newPanelWidth),panelCell.maWi(newPanelWidth); // maWi() allows the overflow to work.

    }
    //ISPACES.log.debug('totalWidth = '+totalWidth);
  }
  */

  /*
  ,resizePanel:function(e,panelLeft,panelRight,startX,leftWidth,rightWidth){
    ISPACES.log.debug(this.id+".resizePanel("+e+", panelLeft:"+panelLeft+", panelRight:"+panelRight+", startX:"+startX+", leftWidth:"+leftWidth+", rightWidth:"+rightWidth+")");

    var mouseX=Common.getMouseX(e);
    ISPACES.log.debug("mouseX = "+mouseX);

    var mouseMovedX=(mouseX-startX);
    ISPACES.log.debug("mouseMovedX = "+mouseMovedX);

    panelLeft.wi(leftWidth+mouseMovedX),panelRight.wi(rightWidth-mouseMovedX);
  }
  */

  /*
  ,resizePanel:function(e,panelLeft,panelRight,mouseXY,panelLeftWH,panelRightWH){
    ISPACES.log.debug(this.id+'.resizePanel('+e+', '+panelLeft+', '+panelRight+', '+mouseXY+', '+panelLeftWH+', '+panelRightWH+')');
    var resizeXY=Common.getMouseXY(e);
    ISPACES.log.debug("resizeXY[0]="+resizeXY[0]+", resizeXY[1]="+resizeXY[1]);
    var mouseMovedX=(resizeXY[0]-mouseXY[0]);
    ISPACES.log.debug("mouseMovedX = "+mouseMovedX);
    var newPanelLeft=(panelLeftWH[0]+mouseMovedX);
    var newPanelRight=(panelRightWH[0]-mouseMovedX);
    ISPACES.log.debug("newPanelLeft = "+newPanelLeft+", newPanelRight = "+newPanelRight);
    panelLeft.wi(newPanelLeft);
    panelRight.wi(newPanelRight);
  }
  */

  //,addRoots:function(div){
  //,addRoots:function(div,cell){
  ,addRoots:function(o){
    ISPACES.log.debug(this.id+'.addRoots('+o+')');

    /*
    var select=this.createSelect();
    div.add(select);
    //var wh=Common.getWH(div);
    div.wh=Common.getWH(div);
    ISPACES.log.alert(this.id+'.addRoots(div): div.wh[0] ='+div.wh[0]);
    div.wihi(wh[0],wh[1]);
    */
    //div.select=this.createSelect();
    //div.add(div.select);
    //cell.rootUl=this.createRootUl();
    o.cell.rootUl=this.createRootUl(o);

    /* Attempting to select the local default root.
    if(this.localLi){
      ISPACES.log.debug(this.id+'.addRoots(div, cell): this.localLi = '+this.localLi);
      this.localLi.ul.isOpen=true;
      this.selectRoot(this.localLi);
      //this.localLi=null;
    }
    */

    //cell.rootUl.bo(Constants.Borders.GREEN);
    //div.add(cell.rootUl);
    o.selectDiv.add(o.cell.rootUl);
  }

  ,createRootUl:function(o){
    ISPACES.log.debug(this.id+'.createRootUl('+o+')');

    var create=this.create;

    //var topbarCell=o.topbarCell;
    var topbarDiv=o.topbarDiv;
    var topbar=topbarDiv.topbar;
    var selectedLi=o.selectedLi; // When creating the root select, we pass in the previous selected root, so it can be reslected upon recreation.
    var firstTime=o.firstTime; // When creating the root select, we pass in the previous selected root, so it can be reslected upon recreation.

    //ISPACES.log.debug('topbarDiv = '+topbarDiv);
    //ISPACES.log.debug('topbar = '+topbar);
    //ISPACES.log.debug('selectedLi = '+selectedLi);
    //ISPACES.log.debug('firstTime = '+firstTime);

    //,z=roots.length
    var root
    ,rootId
    ,roots=ISPACES.roots.roots
    ,protocol
    ,name
    ,displayName
    ,type
    ,isLocal
    ,totalUsage
    ,_this=this
    ,ul=create.tag(this.constants.UL)
    ,li
    ,lis=[] // lis = listitems @see clickRoot() - this reference is used to show/hide the root items.
    ;

    //ISPACES.log.debug('roots.length = '+roots.length);

    //if(!selectedLi){
    //  roots['select']={name:'Select',protocol:'select'};
    //}

    var localAdded=false;

    for(rootId in roots){

      root=roots[rootId]
      ,protocol=root.protocol
      ,name=root.name
      ,displayName=root.displayName||name
      ,type=root.type
      ,isLocal=root.isLocal
      ,totalUsage=root.totalUsage
      ;

      //ISPACES.log.debug('root = '+root);
      //ISPACES.log.debug('displayName = '+displayName);
      //ISPACES.log.debug('name = "'+name+'", type = "'+type+'", protocol = "'+protocol+'", isLocal = '+isLocal+'", totalUsage = '+totalUsage);

      if(!localAdded)if(isLocal)localAdded=true;

      /*
      var txt;
      if(isLocal){
        var sb=new ISPACES.StringBuilder();
        if(name==this.FSLASH){ // Unix (/)
          sb.appendAll([
            'Local Files ('
            ,protocol
            ,')'
          ]);
        }else{
          sb.appendAll([
            'Local Files ('
            ,name
            ,')'
          ]);
        }
        txt=sb.asString();
      }else{
        txt=name;
      }
      */
      //if(!displayName)displayName=name;

      /*
      var sb=new ISPACES.StringBuilder();
      if(isLocal){
        sb.append('Local Disk (').append(name).append(Constants.Characters.RIGHTPAREN);
      }else{
        sb.append('Cloud Files (').append(name).append(Constants.Characters.RIGHTPAREN);
      }
      name=sb.asString();
      */

      //*/

      //li=this.createLi(this.create.txt(name));
      //li=this.createLi(this.create.txt(txt));
      li=create.li(create.txt(displayName));
      li.index=i;
      li.protocol=protocol;
      li.root=root;
      li.name=name;
      //li.topbarCell=topbarCell;
      li.topbarDiv=topbarDiv;
      li.isLocal=isLocal;

      if(totalUsage){

        var size=ISPACES.StringFormat.bytesToSize(parseInt(totalUsage),1);
        //ISPACES.log.debug('size = '+size);

        li.add(
          create.txt(
            new ISPACES.StringBuilder([
              ' ('
              ,size
              ,')'
            ]).asString()
          )
        );

      }

      /*
      //li.ocButton(function(){_this.selectRoot(this)});
      li.ocButton(function(e){
        ISPACES.log.debug('li.ocButton('+e+')');
        _this.clickRoot(this);
        Common.stopEvent(e); // Prevent the event from propogating as the DIV and event handler above this, as it opens the root select.
        Common.killEvent(e); // Prevent the event from propogating as the DIV and event handler above this, as it opens the root select.
        Common.stopDefaultEvent(e); // Prevent the event from propogating as the DIV and event handler above this, as it opens the root select.
        return false;
      });
      //*/
      //li.ocButton(this.clickRoot.bind(this,protocol));
      //li.ocButton(this.clickRoot.bind(this,li));

      /*
      if(ISPACES.isTouchDevice){
        //li.addListener('touchend',this.clickRoot.bind(this,li),false); // touch
        li.addListener(
          'touchstart'
          ,this.clickRoot.bind(this,li)
          ,false
        ); // touch
      }else{
        li.addListener(
          this.constants.MOUSEDOWN
          ,this.clickRoot.bind(this,li)
          ,false
        ); // click
      }
      */

      li.addListener(
        this.constants.MOUSEDOWN
        ,this.clickRoot.bind(this,li)
      );

      //li.mo(function(){_this.selectRoot(this)});
      //if(i==0)li.setClass('selected'); // temporary

      /*
      if(i==0){
        li.setClass('selected'); // temporary
      }else{
        li.setClass('');
      }
      */

      if(selectedLi){

        var selectedProtocol=selectedLi.protocol;
        //ISPACES.log.debug('protocol = '+protocol+', selectedProtocol = '+selectedProtocol);
        //ISPACES.log.debug('selectedProtocol = '+selectedProtocol);
        if(selectedProtocol==protocol){
          //ISPACES.log.debug(this.id+'.createRootUl('+o+'): li.setClass(\'selected\')');
          li.setClass('selected');
          ul.li=li;
        }

      }else{

        //if(i==0){
        //if(i=='Select'){
        if(protocol=='select'){
          //ISPACES.log.debug(this.id+'.createRootUl('+o+'): li.setClass(\'selected\')');
          li.setClass('selected');
        }else{
          li.setClass('');
        }

      }

      ul.add(li);
      li.ul=ul; // Set the UL elements as a property of the child LI element for easy access.
      lis.push(li); // Add the list item elements to the array of list items for quick access.

      /*
      if(
        !this.localLi
        &&isLocal
        &&o.left
      ){
        this.localLi=li;
        this.localLi.setClass('selected');
      }else if(i==0)li.setClass('selected');
      */

      /*
      // Set the initial local root.
      if(o.left){
        //if(i==1){
        //  //li.setClass('selected');
        //  this.clickLi(li);
        //}else if(protocol.toLowerCase().startsWith('c')){
        //  //li.setClass('selected');
        //  this.clickLi(li);
        //}
        this.rootLisLeft[protocol]=li;
      }else{
        if(i==0)li.setClass('selected');
        this.rootLisRight[protocol]=li;
      }
      */


      /*
      var divIcon=create.divCell();
      divIcon.setClass(type).miWiHi(16);
      divIcon.style.emptyCells='show';
      li.divIcon=divIcon;
      */

      /*
      //var divName=create.div(create.txt(name));
      var divName=create.tag(Constants.Tags.DIV).add(create.txt(name));
      divName.setClass('name');
      divName.bo(Constants.Borders.BORE);
      divName.alB();

      var divText=create.divCell(divName);
      divText.setClass('text');
      divText.bo(Constants.Borders.BOOR);

      //var divArrow=create.divCell();
      var divArrow=create.divCell(create.txt(Constants.Characters.NBSP));
      divArrow.setClass('arrow');
      divArrow.bo(Constants.Borders.BOOR);

      //var divTable=create.divTable(create.divRow([divIcon,divText,divArrow]));
      var divTable=create.divTable(create.divRow([divText,divArrow]));
      divTable.bo(Constants.Borders.BOBL);
      */

    }

    /*
     * This adds the default initial "Select" drop-down menu item where the drop-down has not been clicked before.
     */
    //ISPACES.log.debug('selectedLi = '+selectedLi);
    //ISPACES.log.debug('firstTime = '+firstTime);

    if(firstTime){

      //roots['select']={name:'Select',protocol:'select'};

      //li=createLi(create.txt(name));
      li=create.li(create.txt(ISPACES.getString('Select')));
      //li.protocol=protocol;
      li.protocol='select';
      li.name='select';
      li.topbarDiv=topbarDiv;
      li.setClass('selected');
      //li.ocButton(this.clickRoot.bind(this,li));

      /*
      if(ISPACES.isTouchDevice){
        //li.addListener('touchend',this.clickRoot.bind(this,li),false); // touch
        li.addListener(
          'touchstart'
          ,this.clickRoot.bind(this,li)
          ,false
        ); // touch
      }else{
        li.addListener(
          this.constants.MOUSEDOWN
          ,this.clickRoot.bind(this,li)
          ,false
        ); // click
      }
      */

      li.addListener(
        this.constants.MOUSEDOWN
        ,this.clickRoot.bind(this,li)
      );

      ul.add(li);
      li.ul=ul; // Set the UL elements as a property of the child LI element for easy access.
      //lis.push(li); // Add the list item elements to the array of list items for quick access.
    }

    /*
     * If the local roots have not been accessed, we provide a "Local Files" ption to load them.
     */
    //*
    //ISPACES.log.debug(this.id+'.createRootUl('+o+'): localAdded = '+localAdded);
    if(!localAdded){

      li=create.li(create.txt(ISPACES.getString('Local Files')));

      li.addListener(
        this.constants.CLICK
        ,this.addLocalRoots.bind(this)
      );

      //li.ul=ul; // Set the UL elements as a property of the child LI element for easy access.
      //lis.push(li); // Add the list item elements to the array of list items for quick access.
      ul.add(li);
    }
    //*/

    // Set the list items as a property of the UL element for quick access.
    ul.lis=lis;

    return ul;
  } // createRootUl()

  //,tree:function(){
  //,tree:function(root){
  //,tree:function(cell){
  //,tree:function(protocol){
  //,tree:function(protocol,isLocal){
  //,tree:function(panelCell){
  ,tree:function(o){
    ISPACES.log.debug(this.id+'.tree(o:'+o+')');

    /*
    var panelCell=o.panelCell
      ,protocol=o.protocol
      ,fileDiv=o.fileDiv
      ,refresh=o.refresh
      ,isLocal=o.isLocal
    ;

    ISPACES.log.debug('panelCell = '+panelCell);
    ISPACES.log.debug('protocol = '+protocol);
    ISPACES.log.debug('fileDiv = '+fileDiv);
    ISPACES.log.debug('refresh = '+refresh);
    ISPACES.log.debug('isLocal = '+isLocal);
    */

    //this.panelCell.protocol=protocol; // Set the protocol as a property of the panelCell. @see save() & recreate(). Moved to recreate() & clickRoot()

    //var protocol=root.protocol;
    //ISPACES.log.debug(this.id+'.tree(root): protocol = '+protocol);

    //var tree=this.createTree(root);
    //var tree=this.createTree();
    //var tree=this.createTree(protocol);
    //var tree=this.createTree(protocol,isLocal);
    //ISPACES.log.debug('tree = '+tree);

    //this.createTree(protocol,isLocal);
    //this.createTree(protocol,fileDiv,isLocal);
    //this.createTree(o);
    this.addTree(o);

    /*
    if(tree){ // The createTree function returns null where there needs to be authentication.

      this.fileDiv.replaceFirst(tree); // Replace the old file table with the new one.

      //cell.tree=tree; // Set the tree as a property of the cell for easy reference.

      //this.clickLi(null,tree.fC()); // Simulate the mouse down on the first row, to select it.

      //this.leftPath.hide();
      //this.leftCols.hide();
      //this.colDiv.hide();

      //new ISPACES.AsyncApply(this,TotalUsageControl
      //new ISPACES.AsyncApply(this,"addTotalUsage",[tree],10);
      //new ISPACES.AsyncApply(this,"addTotalUsage",[protocol],10);
      //new ISPACES.AsyncApply(this,"addTotalUsage",[protocol],3000);
      new ISPACES.AsyncApply(this,"treeLoaded",[protocol],1);
    }
    */

    //return tree;
  }



  /*
   * Make this function more dynamic by passing in the fileDiv to be refreshed.
   */
  //,createTree:function(){
  //,createTree:function(root){
  //,createTree:function(protocol){
  //,createTree:function(protocol,isLocal){
  //,createTree:function(protocol,fileDiv,isLocal){
  //,createTree:function(o){
  ,addTree:function(o){
    ISPACES.log.debug(this.id+'.addTree(o:'+o+')');

    var panelCell=o.panelCell
    ,protocol=o.protocol
    ,fileDiv=panelCell.fileDiv
    ,fileDivCell=panelCell.fileDivCell
    ,refresh=o.refresh
    ,isLocal=panelCell.isLocal
    ,url=o.url
    ;

    //ISPACES.log.debug('panelCell = '+panelCell);
    //ISPACES.log.debug('protocol = '+protocol);
    //ISPACES.log.debug('fileDiv = '+fileDiv);
    //ISPACES.log.debug('fileDivCell = '+fileDivCell);
    //ISPACES.log.debug('refresh = '+refresh);
    //ISPACES.log.debug('isLocal = '+isLocal);
    //ISPACES.log.debug('url = '+url);

    /*
     * Asyncronously get the file listing using a callback.
     */
    var _this=this;
    var path=this.constants.FSLASH;
    var fileName=this.constants.EMPTY;

    ISPACES.files.getAsync(
      isLocal
      ,protocol
      ,path
      ,fileName
      ,this.createTree.bind(this,panelCell)
      //,this.createTree.bind(this,panelCell,isLocal,protocol,path)
      ,refresh
    );

  }

  ,createTree:function(
    panelCell
    ,isLocal
    ,protocol
    ,path
    ,fileMap
  ){
    ISPACES.log.debug(this.id+'.createTree(panelCell:'+panelCell+', isLocal:'+isLocal+', protocol:'+protocol+', path:'+path+', fileMap:'+fileMap+')');
    //ISPACES.log.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)ISPACES.log.debug('arguments['+i+'] = '+arguments[i]);

    /*
     * If the fileMap being returned is a string, it is the authentication URL.
     */
    //ISPACES.log.debug('Common.isString(fileMap) = '+Common.isString(fileMap));
    if(Common.isString(fileMap)){

      this.authenticate(protocol,fileMap);
      return;

    }

    var ul=this.createTreeUl(
      isLocal
      ,protocol
      ,path
      ,fileMap
    );

    var fileDiv=panelCell.fileDiv
    ,fileDivCell=panelCell.fileDivCell
    ;

    //ISPACES.log.debug('fileDiv = '+fileDiv);
    //ISPACES.log.debug('fileDivCell = '+fileDivCell);

    //var wh=Common.getWH(fileDivCell);
    //ISPACES.log.debug('wh = '+wh);

    if(!fileDiv){

      fileDiv=this.create.div(ul).setClass('files');
      //fileDiv.wi(wh[0]);
      fileDiv.owX(Constants.Properties.HIDDEN);
      fileDiv.owY(Constants.Properties.AUTO);

      panelCell.fileDiv=fileDiv;

      fileDivCell.replaceFirst(fileDiv); // Replace the old file table with the new one.
      //fileDivCell.add(fileDiv); // Replace the old file table with the new one.

    }else{

      fileDiv.replaceFirst(ul); // Replace the old file table with the new one.

    }

    panelCell.ul=ul; // Set a reference to the tree on the panelCell. @see refreshUrl()
    //panelCell.isLocal=isLocal; // @see okCopy()

    //ul.panelCell=panelCell;
    //li.ul.show();
    //ul.show();
    //this.openLi(li);

    //if(!isLocal)new ISPACES.AsyncApply(_this,"treeLoaded",[protocol],1);
  }

  /*
   * This creates a UL element containing the listing for the specified path.
   */
  ,createTreeUl:function(
    isLocal
    ,protocol
    ,path
    ,fileMap
  ){
    ISPACES.log.debug(this.id+'.createTreeUl(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileMap:'+Common.size(fileMap)+')');

    // Create the unordered list.
    //var ul=this.create.tag(Constants.Tags.UL);
    var ul=this.create.tag(this.constants.UL);
    //var ul=this.createUl().addAll(folders).addAll(files);
    //var ul=this.create.div();

    var li
    ,fileName
    ,folders=[]  // Split the file listing into folders and files.
    ,folderDivs=[]  // Split the file listing into folders and files.
    ,files=[]
    ;

    for(fileName in fileMap){
      //ISPACES.log.debug('fileName = '+fileName);

      li=this.createFileLi(
        isLocal
        ,protocol
        ,path
        ,fileName
        ,fileMap[fileName]
      );

      //li.bo(Constants.Borders.BOBL);
      //ul.li=li; // @see
      //li.ul=ul; // set a reference to the UL on the LI @see
      li.parentUl=ul; // set a reference to the parent UL on the LI @see drop() & mouseUp() & copied()
      // May be able to use parentNode instead

      if(li.isDir){
        folders.push(li);
        folderDivs.push(li.div);
      }else{
        files.push(li);
      }

    }

    ul.addAll(folders).addAll(files); // Add the folders first, then the files.
    ul.sA('name','file-ul');
    ul.setClass('file-ul');
    //ul.bo(Constants.Borders.BORE);

    //this.addDropTargets(folders); // Add drop targets on the folders.
    //this.addDropFolders(folders); // Add drop targets on the folders.
    this.addDropFolders(folderDivs); // Add drop targets on the folders.

    return ul;
  }

  /*
  ,addDropTargets:function(a){
    //ISPACES.log.debug(this.id+'.addDropTargets('+a+')');
    this.dropTargets.clear();
    a.forEach(this.addDropTarget.bind(this)); // Native fun.
  }

  ,addDropTarget:function(o){
    //ISPACES.log.debug(this.id+'.addDropTarget('+o+')');
    //if(!this.dropTargets)this.dropTargets=[]; // lazy loading?
    this.dropTargets.push(o);
  }
  */
  ,addDropPanels:function(a){
    //ISPACES.log.debug(this.id+'.addDropPanels('+a+')');
    this.dropPanels.clear();
    a.forEach(this.addDropPanel.bind(this)); // Native fun.
  }

  ,addDropPanel:function(o){
    //ISPACES.log.debug(this.id+'.addDropPanel('+o+')');
    //if(!this.dropPanels)this.dropPanels=[]; // lazy loading?
    this.dropPanels.push(o);
  }

  ,addDropFolders:function(a){
    //ISPACES.log.debug(this.id+'.addDropFolders('+a+')');
    //this.dropFolders.clear();
    a.forEach(this.addDropFolder.bind(this)); // Native fun.
  }

  ,addDropFolder:function(o){
    //ISPACES.log.debug(this.id+'.addDropFolder('+o+')');
    //if(!this.dropFolders)this.dropFolders=[]; // lazy loading?
    this.dropFolders.push(o);
  }

  ,createFileLi:function(
    isLocal
    ,protocol
    ,path
    ,fileName
    ,file
  ){
    //ISPACES.log.debug(this.id+'.createFileLi(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileName:"'+fileName+'", file:'+file+')');

    var _this=this;

    var url=this.getFileUrl(protocol,path,fileName);
    //ISPACES.log.debug('url = "'+url+'"');

    var isDir=(file===0)||!Common.isArray(file);
    //ISPACES.log.debug('isDir = '+isDir);

    var div=this.create.div(this.create.txt(fileName))
    ,li=this.create.li(div)
    ;

    div.isLocal=isLocal;
    div.isDir=isDir;
    div.url=url; // set a reference to the URL on the DIV @see drop()
    div.fileName=fileName; // set a reference to the fileName on the DIV @see Ui.startDragging()

    li.div=div;
    li.isLocal=isLocal;
    li.protocol=protocol;
    li.path=path;
    li.fileName=fileName;
    li.url=url;

    div.li=li; // set a reference to the LI on the DIV @see drop()

    var ext
    ,mimeType
    ;

    if(isDir){

      li.isDir=true;
      ext='folder';
      div.sA('type','folder'); // This is used to set the unicode file icon. @see MimeTypes.getChar()

    }else{

      div.sA('type','file'); // This is used to set the unicode file icon. @see MimeTypes.getChar()

      ext=ISPACES.applications.getExt(fileName);
      mimeType=ISPACES.MimeTypes.mimeTypes[ext];
      //ISPACES.log.debug('mimeType = '+mimeType);
      //if(!mimeType)mimeType=ISPACES.MimeTypes.mimeTypes['default'];
      //ISPACES.log.debug('mimeType.id = '+mimeType.id);
      if(!mimeType)ext='default'; // If there is no mimetype, set to default, so the file gets an icon.

      li.addListener(
        Constants.Events.DBLCLICK
        ,function(e){
          ISPACES.applications.launchFileName(this,e);
          //Common.stopDefaultEvent(e);
        }
      );

    }
    //ISPACES.log.debug('ext = '+ext);

    div.sA('ext',ext); // This is used to set the unicode file icon. @see MimeTypes.getChar()

    /*
     * mouseDownLiBefore() selects the file/folder
     * mouseDownLi toggles open the tree and kills the event to prevent it from closing the tree. this is because of the structure of the tree where child listing are sub elements of paretn folders.
     */
    //*
    li.addListener(
      this.constants.MOUSEDOWN
      ,this.mouseDownLiBefore.bind(this,li)
      ,true // Set the event capturing phase to 'capturing'.
    );

    li.addListener(
      this.constants.MOUSEDOWN
      ,this.mouseDownLi.bind(this,li)
    );
    //*/

    li.addListener(
      this.constants.CLICK
      ,this.clickLi.bind(this,li)
    );

    li.addListener(
      Constants.Events.CONTEXTMENU
      ,this.showContextMenu.bind(this)
    );

    div.addListener(
      this.constants.MOUSEDOWN
      ,function(e){
        ISPACES.log.debug(_this.id+': div.mouseDown(e:'+e+')');

        //ISPACES.log.debug('url = '+url);

        var button=e['button']; // get the button number that was clicked. 0 = left click, 2 = right click
        var which=e['which']; // get which button was clicked. 1 = left click, 3 = right click

        //ISPACES.log.debug('button = '+button);
        //ISPACES.log.debug('which = '+which);

        /*
        ISPACES.log.object(e);
        ISPACES.log.debug('e.shiftKey = '+e.shiftKey);
        ISPACES.log.debug('e.ctrlKey = '+e.ctrlKey);
        ISPACES.log.debug('e.altKey = '+e.altKey);
        ISPACES.log.debug('e.button = '+e.button);
        ISPACES.log.debug("e['button'] = "+e['button']);
        */

        /*
         * Activate the drag on left click only. button == 0, which == 1
         * Right-click on Mac: button == 2
         */
        if(
          //button==0 // Mac uses CTRL-Click to activate the context menu, so we need to check for that here before creating a mouse
          which==1 // Mac uses CTRL-Click to activate the context menu, so we need to check for that here before creating a mouse
          &&!this.mouseMoveFunction // Sometimes the dragging gets stuck on.
        ){

          //ISPACES.global.draggableObject=_this; // Global catch-all object.
          //ISPACES.global.mouseUpObject=_this; // Global catch-all object.

          /*
          var mouseDownXY=Common.getMouseXY(e)
            ,mouseDownX=mouseDownXY[0]
            ,mouseDownY=mouseDownXY[1]
          ;
          */
          var mouseDownX=e.pageX,mouseDownY=e.pageY;

          var divXY=Common.getXY(div)
          ,divX=divXY[0]
          ,divY=divXY[1]
          ;

          var scrollTop=_this.fileDiv.scrollTop;

          //ISPACES.log.debug("mouseDownXY = "+mouseDownXY);
          //ISPACES.log.debug("divXY = "+divXY);
          //ISPACES.log.debug('scrollTop = '+scrollTop);

          //divXY[1]-=scrollTop; // Adjust the drag calculation for any scrolled amount.
          divY-=scrollTop; // Adjust the drag calculation for any scrolled amount.

          var divClone
          //,_div=div // set a reference to the event div
          ,mouseMovedX
          ,mouseMovedY
          ,threshold=3  // the distance in pixel that dragging has to cross before a clone is created and a real drag happens.
          ;

          /*
           * Add an initial mousemove listener before the real mousemove listener which activates after the xy passes a threshold.
           */
          Common.addListener(
            document
            ,Constants.Events.MOUSEMOVE

            //,_this.mouseMoveFunction=function(e1){ // _this == FileManager
            //,this.mouseMoveFunction=function(e1){ // this == document
            //,_div.mouseMoveFunction=function(e1){ // _div == div
            ,div.mouseMoveFunction=function(e1){ // _div == div
              //ISPACES.log.debug(_this.id+': div.mouseDown(e:'+e+'): _div.mouseMoveFunction(e1:'+e1+')');

              //var mouseXY=Common.getMouseXY(e1);
              var mouseX=e1.pageX,mouseY=e1.pageY;

              //mouseMovedX=(mouseXY[0]-mouseDownXY[0]),mouseMovedY=(mouseXY[1]-mouseDownXY[1]);
              //mouseMovedX=(mouseXY[0]-mouseDownX),mouseMovedY=(mouseXY[1]-mouseDownY);
              mouseMovedX=(mouseX-mouseDownX),mouseMovedY=(mouseY-mouseDownY);

              //ISPACES.log.debug("mouseXY = "+mouseXY);
              //ISPACES.log.debug('mouseMovedX = '+mouseMovedX+', mouseMovedY = '+mouseMovedY);

              //ISPACES.log.debug('mouseMovedX>threshold = '+(mouseMovedX>threshold));
              //ISPACES.log.debug('mouseMovedX<-threshold = '+(mouseMovedX<-threshold));
              //ISPACES.log.debug('mouseMovedY>=threshold = '+(mouseMovedY>=threshold));
              //ISPACES.log.debug('mouseMovedY<=-threshold = '+(mouseMovedY<=-threshold));

              /*
               * If the threshold has been passed, start up the dragger by calling ISPACES.ui.startDragging() and remove this mousemove handler.
               * This seems to break dragging in Opera browser.
               */
              if(
                mouseMovedX>=threshold
                ||mouseMovedX<=-threshold
                ||mouseMovedY>=threshold
                ||mouseMovedY<=-threshold
              ){

                if(!div.dragging){
                  div.dragging=true;

                  //div.panelCell=_this.panelCell; // Set the panelCell as a property of the div. @see okCopy()

                  /*
                   * Set the global mouseup handler to this file manager object. @see Common.mouseUp(), Space.mouseUp()
                   */
                  ISPACES.global.mouseUpObject=_this; // Global catch-all object.

                  //ISPACES.ui.startDragging(
                  //var draggable=ISPACES.ui.startDragging(
                  var draggable=ISPACES.spaces.space.startDragging(
                    div
                    ,mouseDownX
                    ,mouseDownY
                  );

                  draggable.panelCell=_this.panelCell; // Set the panelCell as a property of the div. @see okCopy()
                  draggable.ap=_this; // Set the panelCell as a property of the div. @see okCopy()
                  draggable.mouseDownElement=div; // Set a reference to the source element where the mouse down occurred. @see mouseUp() & drop()
                  draggable.url=url; // Set a reference... @see Space.recycle()
                  //draggable.isDir=isDir; // is this a directory/folder?
                  //draggable.isDir=div.isDir; // is this a directory/folder?
                  //draggable.isLocal=isLocal; // is this a directory/folder?
                  draggable.isDesktop=false; // Set isDesktop=falsee so that dragging a folder item onto the desktop produces a modal when dropped.

                  //ISPACES.log.debug("draggable.url = "+draggable.url);

                  /*
                  div.divClone=divClone;
                  divClone.srcElement=div; // set a reference to the source element where the mouse down occurred @see mouseUp() & drop()
                  div.ap=_this; // set a reference to the current app in case we are copying from one app to another.
                  div.panelCell=_this.panelCell;
                  divClone.url=url; // Set a reference. @see Space.recycle()
                  divClone.po(Constants.Properties.ABSOLUTE);
                  divClone.toFront1();
                  //divClone.bo(Constants.Borders.BORE);
                  //divClone.setClass(className);
                  //divClone.setClass(className+' dragging');
                  //divClone.setClass('dragging'); // Set the className to dragging so the cloned element can have a hover look.
                  //ISPACES.log.debug('div.mouseDown(): divClone.sA(\'ext\', '+className+')');
                  //divClone.sA('ext',className);
                  //ISPACES.log.debug('div.mouseDown(): divClone.sA("ext", "'+ext+'")');
                  //divClone.sA('ext',ext); // This is used to set the unicode file icon. @see MimeTypes.getChar()

                  //divClone.lt(divXY[0]),divClone.tp(divXY[1]);
                  //divClone.lt(divX),divClone.tp(divY);
                  //divClone.xy(divX,divY);

                  // Set the global drag element and the mouseUp catcher.
                  //_this.draggable=divClone;
                  //ISPACES.draggable=divClone;
                  ISPACES.global.draggable=divClone; // Set the global drag element. @see ISPACES.global.mouseUpCapturing()
                  ISPACES.global.mouseUpCapturing=ISPACES.spaces.space; // For dropping the on the desktop.
                  */

                } // if(!div.dragging)

                /*
                 * Now that the threshold has been reached and the div cloned, remove the mousemove listener and replace it with the most efficient handler without any if/else statements.
                 */
                Common.removeListener(
                  document
                  ,Constants.Events.MOUSEMOVE
                  ,div.mouseMoveFunction
                );
                div.mouseMoveFunction=null;

                /*
                //_this.draggable=divClone;
                //ISPACES.draggable=divClone;
                //ISPACES.dropObject=_this;
                //ISPACES.dropObject=ISPACES.spaces.space; // Catch-all mouseUp() handler in Space.js
                //ISPACES.dropObject=ISPACES.spaces.space.desktop; // Catch-all mouseUp() handler in Desktop.js
                //ISPACES.global.mouseUpCapturing=ISPACES.spaces.space; // For dropping the on the desktop.
                */

              } // if(mouseMovedX>=threshold||mouseMovedX<=-threshold||mouseMovedY>=threshold||mouseMovedY<=-threshold){

            }
          );

        } // if(button==0 && !this.mouseMoveFunction)
        //} // if(!e.ctrlKey)

        //e.preventDefault(); // prevent a selection
        //Common.killEvent(e);
        //return false;
      }

    ); // div.addListener(this.constants.MOUSEDOWN...

    /*
    if(ISPACES.isTouchDevice){ // touch

      //addListener(
      //  div
      div.addListener(
        'touchstart'
        ,this.touchStart.bind(this,div)
        //,true
        ,false
      );

      //addListener(
      //  div
      div.addListener(
        'touchend'
        ,this.touchEnd.bind(this,div)
        ,false
      );

    } // if(ISPACES.isTouchDevice)
    //*/

    div.mouseUp=function(e){
      ISPACES.log.debug(_this.id+': div.mouseUp(e:'+e+')');

      //ISPACES.log.debug("this.mouseMoveFunction = "+this.mouseMoveFunction);
      //ISPACES.log.debug("_this.mouseMoveFunction = "+_this.mouseMoveFunction);

      this.dragging=false;

      if(this.dragging){
        this.dragging=false;
      }

      //ISPACES.global.mouseUpObject=null; // Global catch-all object.

      if(this.mouseMoveFunction){
        Common.removeListener(
          document
          ,Constants.Events.MOUSEMOVE
          ,this.mouseMoveFunction
          ,false
        );
        this.mouseMoveFunction=null;
      }

      if(_this.mouseMoveFunction){
        Common.removeListener(
          document
          ,Constants.Events.MOUSEMOVE
          ,_this.mouseMoveFunction
          ,false
        );
        _this.mouseMoveFunction=null;
      }

      //ISPACES.log.debug("this.mouseMoveFunction = "+this.mouseMoveFunction);
      //ISPACES.log.debug("_this.mouseMoveFunction = "+_this.mouseMoveFunction);

      //if(this.divClone)this.divClone.rm();
      if(this.divClone)this.divClone.hide();
    };

    div.addListener(
      this.constants.MOUSEUP // can be mouseup or touchend
      ,div.mouseUp
    );

    //div.dc(function(e){ISPACES.applications.launchFileName(this,e)}); // TO launch a folder. This does not seem to work as mouse down opens a folder.

    /*
    div.draggable=true;
    div.sA('draggable','true');

    div.addListener('dragstart',function(e){
      ISPACES.log.debug('handleDragStart');
      //this.style.opacity = '0.4';  // this / e.target is the source node.
      //dragSrcEl=this;
      //e.dataTransfer.effectAllowed = 'move';
      //e.dataTransfer.setData('text/html', this.innerHTML);
    },false);

    div.addListener('dragenter',function(){
      ISPACES.log.debug('handleDragEnter')
    },false);

    div.addListener('dragover',function(e){
      ISPACES.log.debug('handleDragOver');
      //if (e.preventDefault)e.preventDefault(); // Necessary. Allows us to drop.
      //e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
      return false;
    },false);

    div.addListener('dragleave',function(e){
      ISPACES.log.debug('handleDragLeave');
    },false);

    div.addListener('drop',function(e){
      ISPACES.log.debug('handleDrop');
    },false);

    div.addListener('dragend',function(e){
      ISPACES.log.debug('handleDragEnd');
    },false);

    div.addListener('drop',function(e){
      ISPACES.log.debug('handleDragEnd');
    },false);
    */

    //li.md(function(e){_this.clickLi(e,li);Common.stopEvent(e)});
    //li.md(function(e){Common.stopEvent(e)});
    //li.md(function(e){ // TBD - this mousedown should drag the file.
    //  ISPACES.log.debug('li.md('+e+')');

      /*
      Common.stopEvent(e);
      //Common.stopDefaultEvent(e);
      //Common.killEvent(e);
      return false;
      //*/
    //});

    return li;
  } // createFileLi()

  //,holdAsyncApply:{}


  /*
   * Refresh
   */

  ,refreshUrl:function(url){
    ISPACES.log.debug(this.classId+'.refreshUrl(url:"'+url+'")');

    var split=url.split(this.constants.FSLASH);
    //ISPACES.log.debug('split = '+split);

    var slice=split.slice(1,(split.length-1));
    //ISPACES.log.debug('slice = '+slice);

    var sliceLength=slice.length;
    //ISPACES.log.debug('sliceLength = '+sliceLength);

    var panelCell=this.panelCell
    ,protocol=panelCell.protocol
    ,isLocal=panelCell.isLocal
    ,ul=panelCell.ul
    ;

    //ISPACES.log.debug('panelCell = '+panelCell);
    //ISPACES.log.debug('protocol = '+protocol);
    //ISPACES.log.debug('isLocal = '+isLocal);
    //ISPACES.log.debug('ul = '+ul);

    /*
    this.tree({
      panelCell:panelCell
      ,protocol:protocol
      ,isLocal:isLocal
      ,url:url
    });
    */

    var childNodes=ul.childNodes;
    //ISPACES.log.debug('childNodes = '+childNodes);
    //ISPACES.log.debug('childNodes.length = '+childNodes.length);
    //ISPACES.log.debug('ul.lis = '+ul.lis);

    var li
      //,lis=ul.lis
      //,lis=childNodes
      ,z=childNodes.length
      ,i
      ,dir
    ;
    //ISPACES.log.debug('lis.length = '+lis.length);

    var panelCell=this.panelCell;

    for(i=0;i<z;i++){
      //li=lis[i];
      //li=childNodes.getItem[i];
      li=childNodes[i];

      //ISPACES.log.debug('li.isLocal = '+li.isLocal);
      //ISPACES.log.debug('li.protocol = "'+li.protocol+'"');
      //ISPACES.log.debug('li.fileName = '+li.fileName+'"');
      //ISPACES.log.debug('li.path = '+li.path);
      //ISPACES.log.debug('li.fileName = '+li.fileName+'"');

      var fileName=li.fileName;

      for(var j=0;j<slice.length;j++){

        dir=slice[j];

        //ISPACES.log.debug('fileName = '+fileName+'", dir = '+dir+'"');

        if(fileName==dir){

          ISPACES.log.debug('(fileName==dir)');

          if(i==sliceLength){
            li.refresh=true;
            li.isOpen=false;
            this.toggleOpenFolder(li);
          }
        }
      }
    }
  }

  ,refresh:function(refresh){
    ISPACES.log.debug(this.classId+'.refresh(refresh:'+refresh+')');

    var panelCell=this.panelCell
    ,li=panelCell.li
    ;

    //ISPACES.log.debug('panelCell = '+panelCell);
    //ISPACES.log.debug('li = '+li);

    if(li){
      this.refreshLi(li,panelCell);
      return
    }

    var protocol=panelCell.protocol;
    var isLocal=panelCell.isLocal;

    //ISPACES.log.debug('protocol = '+protocol);
    //ISPACES.log.debug('isLocal = '+isLocal);

    //this.tree(protocol,isLocal);
    //this.tree(protocol);
    //this.tree(panelCell);
    this.tree({
      panelCell:panelCell
      ,protocol:protocol
      //,isLocal:isLocal
      ,refresh:refresh
    });

  }

  //,refreshPanel:function(panelIndex){
    //ISPACES.log.debug(this.classId+'.refreshPanel(panelIndex:'+panelIndex+')');
  ,refreshPanel:function(panelCell){
    ISPACES.log.debug(this.classId+'.refreshPanel(panelCell:'+panelCell+')');

    this.tree({
      panelCell:panelCell
      ,protocol:panelCell.protocol
      ,fileDiv:panelCell.fileDiv
      //,isLocal:panelCell.isLocal
      ,refresh:true
    });

  }

  /*
   * If li is a file, we need to update the parent.
   */
  ,refreshLi:function(
    li
    ,panelCell
  ){
    ISPACES.log.debug(this.classId+'.refreshLi(li:'+li+', panelCell:'+panelCell+')');

    if(li){

      //ISPACES.log.debug('li.url = '+li.url);

      // If the 'li' is a file, update the parent.
      var isDir=li.isDir;
      //ISPACES.log.debug('isDir = '+isDir);

      if(!isDir){
        var ulParent=li.parentNode;
        //ISPACES.log.debug('ulParent = '+ulParent);
        var liParent=ulParent.li;
        //ISPACES.log.debug('liParent = '+liParent);
        if(liParent){
          li=liParent;
        }else{
          //this.refreshPanel(li.panelCell);
          this.refreshPanel(panelCell||this.panelCell);
          return;
        }
      }

      li.refresh=true;
      li.isOpen=false;
      //li.ul=null; // Set the ul to null, so that it can be recreated.
      this.toggleOpenFolder(li);
    }else{
      this.refresh(true);
      return;
    }

    /*
    var url=li.url
      ,path=li.path
      ,fileName=li.fileName
    ;

    ISPACES.log.debug('url = '+url);
    ISPACES.log.debug('path = '+path);
    ISPACES.log.debug('fileName = '+fileName);

    var panelCell=this.panelCell
      ,protocol=panelCell.protocol
      ,isLocal=panelCell.isLocal
      ,ul=panelCell.ul
    ;

    ISPACES.log.debug('panelCell = '+panelCell);
    ISPACES.log.debug('protocol = '+protocol);
    ISPACES.log.debug('isLocal = '+isLocal);
    ISPACES.log.debug('ul = '+ul);
    */

    /*
    li.refresh=true;
    li.isOpen=false;
    this.toggleOpenFolder(li);
    */

    /*
    this.tree({
      panelCell:panelCell
      ,protocol:protocol
      ,isLocal:isLocal
      ,url:url
    });
    */

  }


  /*
   * Mouse/Touch Events
   */

  ,clickRoot:function(
    liClick
    ,e
  ){
    ISPACES.log.debug(this.id+'.clickRoot(liClick:'+liClick+', e:'+e+')');

    /*
     * Event Cancelling:
     * When selecting roots, it is possible for a double-click to open the
     * select dropdown with the first click, and select the first item with the second click.
     * This causes the default action of a text selection to occur.
     * To prevent this, call preventDefault() on the event object.
     *
     * Add the event cancelling functionality at the beginning of this function, in case it returns before exiting.
     */
    if(e){ // Sometimes this function is called directly to similate a click on the list item, thus there will be no event object.
      //Common.stopEvent(e);
      //Common.stopDefaultEvent(e);
      //Common.killEvent(e); // prevent the click from activating a panelCell drag
      //e.returnValue=false;
      //e.stopPropagation(); // prevent the click from activating a panelCell drag
      e.cancelBubble=true; // prevent the click from activating a panelCell drag
      e.preventDefault(); // prevent the mousedown from creating a text selection
    }

    var root=liClick.root
    ,isLocal=liClick.isLocal
    ,protocol=liClick.protocol
    ,topbar=liClick.topbarDiv.topbar
    ;

    //ISPACES.log.debug('root = '+root);
    //ISPACES.log.debug('isLocal = '+isLocal);
    //ISPACES.log.debug('protocol = '+protocol);
    //ISPACES.log.debug('topbar = '+topbar);

    var _this=this;
    this.root=root;
    //var ul=li.parentNode;
    var ul=liClick.ul;

    /*
     * If the list is closed, open it and return.
     * If the list is open, close it and select the list item.
     */
    if(ul.isOpen){

      ul.li=liClick; // Set a reference to the li selected on the ul.

      /*
      var topbarDiv=li.topbarDiv;
      if(topbarDiv){
        topbarDiv.po(Constants.Properties.RELATIVE);
        //topbarDiv.di(Constants.Properties.TABLECELL);
        //topbarDiv.rel(0,0);
        topbarDiv.wip(100);
      }
      */

      ul.setClass(this.constants.EMPTY);
      //topbar.setClass('topbar');
      ul.isOpen=false;

    }else{

      /*
      var topbarDiv=li.topbarDiv;
      if(topbarDiv){
        var w=Common.getWidth(topbarDiv);
        //ISPACES.log.debug(this.id+'.clickRoot('+li+'): w = '+w);
        topbarDiv.wi(w);
        topbarDiv.po(Constants.Properties.ABSOLUTE);
      }
      */

      //ul.setClass('selectOpen');
      ul.setClass('open');
      //topbar.setClass('topbaropen');
      ul.isOpen=true;

      //if(protocol=='select')liClick.remove(); // This removes the initial "Select" option from the dropdown.
      if(protocol=='select'){
        //ISPACES.log.debug(this.id+'.clickRoot(liClick:'+liClick+', e:'+e+'): (protocol==\'select\')');
        liClick.remove(); // This removes the initial "Select" option from the dropdown.
      }

      //ISPACES.log.debug(this.id+'.clickRoot('+li+'): LEAVING');
      //return;
      return false;
    }

    var li
    ,lis=ul.lis
    ,z=lis.length
    ,i
    ;

    for(i=0;i<z;i++){

      li=lis[i];

      if(li!=liClick){ // Not the selected item... hide it.

        li.setClass(this.constants.EMPTY);

      }else{ // The selected item.

        li.setClass('selected');
        //ISPACES.log.debug(this.id+'.clickRoot('+li+'): ul.li = '+ul.li);
        ul.li=li;

        /*
        if(this.treeShowing){
          //this.tree(this.cell,this.root,FSLASH);
          this.tree();
        }else{
          //this.flat(this.cell,this.root,FSLASH);
          //this.flat(this.cell,this.root,this.constants.EMPTY);
          //this.flat(this.cell,this.root);
          this.flat();
        }
        */

        //this.panelCell.protocol=protocol;

        //this.tree(li.root);
        //this.tree(protocol,isLocal);
        //this.tree(this.panelCell);

        var panelCell=this.panelCell;
        panelCell.protocol=protocol;
        panelCell.isLocal=isLocal; // set a reference to isLocal in the panelCell for quick access. @see okCopy()
        panelCell.li=null; // Remove any reference to a previously selected ilist item from a previously selected root.
        delete panelCell.li;

        this.tree({
          panelCell:panelCell
          ,protocol:panelCell.protocol
          ,fileDiv:panelCell.fileDiv
          //,isLocal:panelCell.isLocal
          //,isLocal:isLocal
          //,refresh:true
        });

        new ISPACES.AsyncCall(
          this
          ,"save"
          ,1000
        );

      }
    }

    //ISPACES.log.debug(this.id+'.clickRoot('+li+'): LEAVING');
    return false;
  }

  ,touchStart:function(div,e){
    ISPACES.log.debug('touchStart(div:'+div+', e:'+e+')');
    ISPACES.log.debug('arguments.length = '+arguments.length);
    for(var i=0;i<arguments.length;i++)ISPACES.log.debug('arguments['+i+'] = '+arguments[i]);

    e.stopPropagation();
    e.preventDefault();

    ISPACES.log.debug('e.screenX = '+e.screenX);
    ISPACES.log.debug('e.screenY = '+e.screenY);
    ISPACES.log.debug('e.target = '+e.target);
    ISPACES.log.debug('e.changedTouches = '+e.changedTouches);
    ISPACES.log.debug('e.currentTarget = '+e.currentTarget);
    //var changedTouches=e.changedTouches;
    //var firstChangedTouch=changedTouches[0];
    //ISPACES.log.debug('first = '+first);

    //this.clickLi(e,e.currentTarget);

    /*
    //e.o=e.currentTarget;
    //e.el=e.currentTarget; // We have to set the target as a property of the event here as passing the event along to the click function looses the currentTarget (= null).
    if(currentTarget){
      e.el=currentTarget; // We have to set the target as a property of the event here as passing the event along to the click function looses the currentTarget (= null).
    }
    */
    e.targetElement=div; // We have to set the target as a property of the event here as passing the event along to the click function looses the currentTarget (= null).

    var touch=e.touches[0];
    ISPACES.log.debug('touch = '+touch);

    //e.o=body;
    //e.target=body;

    //this.holdTimeout=window.setTimeout(this.emulateRightClick,600);
    //this.holdAsyncApply=new ISPACES.AsyncApply(this,"emulateRightClick",null,600);
    //holdAsyncApply=new ISPACES.AsyncApply(this,"emulateRightClick",[e],600);

    //var _this=this;
    //ISPACES.log.debug('touchStart('+e+'): _this = '+_this);
    //ISPACES.log.alert('touchStart('+e+'): _this = '+_this);
    //holdAsyncApply=new ISPACES.AsyncApply(_this,"emulateRightClick",[e],600);
    this.holdAsyncApply=new ISPACES.AsyncApply(
    //this.holdAsyncApply=new ISPACES.AsyncApply(

      //_this
      //null
      this

      /*
      ,function(e){
        ISPACES.log.debug('holdAsyncApply(e:'+e+')');
        //var contextMenu=;
        //contextMenu.show(e);
        ISPACES.spaces.space.desktop.showContextMenu(e);
        Common.stopEvent(e);
        return false;
      }
      _this.showContextMenu(e);
      Common.stopEvent(e);
      return false;
    });
      */
      //,this.showContextMenu.bind(this,e)
      ,"showContextMenu"
      ,[e]
      ,600
    );

    return false;
  }

  ,touchEnd:function(e){
    ISPACES.log.debug('touchEnd('+e+')');

    ISPACES.log.debug('touchEnd('+e+'): this.holdAsyncApply = '+this.holdAsyncApply);
    if(this.holdAsyncApply){
      this.holdAsyncApply.cancel();
      this.holdAsyncApply=null;
    }

    //if(ISPACES.global.escapeObject){
    //  ISPACES.log.debug('mouseClick(e): ISPACES.global.escapeObject');
    //  ISPACES.global.escapeObject.escape();
    //  ISPACES.global.escapeObject=null;
    //  ISPACES.global.escapeKeyObject=null;
    //}

  }

  /*
   * A mousedown on the fileDiv should deselect the selected file, to allow for a top level foder to be created.
   */
  ,mouseDownFileDiv:function(
    e
  ){
    ISPACES.log.debug(this.id+'.mouseDownFileDiv(e:'+e+')');
    if(this.li)this.deselectLi(this.li);
  }

  ,mouseDownLiBefore:function(
    li
    ,e
  ){
    ISPACES.log.debug(this.id+'.mouseDownLiBefore(li.fileName:"'+li.fileName+'", e:'+e+')');

    var panelActive=this.panelCell; // Get the active panel
    //ISPACES.log.debug('panelActive = '+panelActive);

    var selectedListItems=panelActive.selectedListItems; // Get the list of selected items from the active panel.
    if(!selectedListItems)selectedListItems=panelActive.selectedListItems=[];
    //ISPACES.log.debug('selectedListItems.length = '+selectedListItems.length);

    var multipleSelected=(selectedListItems.length>1); // Are there files already selected?

    if(e&&e.ctrlKey){ // If this is a CTRL-Click operation.

      //this.toggleMultipleSelect(li);

      if(li.on){

        this.deselectLi(li);
        selectedListItems.remove(li);

      }else{

        if(!multipleSelected)selectedListItems.push(panelActive.li); // Add the previous selected li. We are doing a multiple select using the CTRL key.

        selectedListItems.push(li); // Add the list item to the array of selected items in this panel.

        // Select the list item.
        this.selectLi(li);
        /*
        li.on=true;
        //this.li=li;
        panelActive.li=li;
        li.div.setClass('selected');
        */

        //this.multipleLisSelected=true;
      }

    }else{

      if(multipleSelected){

        //this.deselectAllLis();
        for(var i=0;i<selectedListItems.length;i++){
          this.deselectLi(selectedListItems[i]);
        }

        selectedListItems.clear();

        multipleSelected=false;

      }else{

        selectedListItems.clear();

        if(panelActive.li)this.deselectLi(panelActive.li);
        /*
        if(panelActive.li){
          //this.deselectLi(panelActive.li);
          panelActive.li.on=false;
          //this.li=li;
          panelActive.li.div.setClass('');
        }
        */
      }

      // Select the list item.
      this.selectLi(li);
      /*
      li.on=true;
      //this.li=li;
      panelActive.li=li;
      li.div.setClass('selected');
      */

      // Add the list item to the array of selected items.
      //this.lis.push(li);
      selectedListItems.push(li);
      //panelActive.selectedListItems.push(li);
    }

    //ISPACES.log.debug('panelActive.selectedListItems.length = '+panelActive.selectedListItems.length);
  }

  /*
   * Handles the mouse down event on the list item in the file tree.
   */
  ,mouseDownLi:function(
    li
    ,e
  ){
    ISPACES.log.debug(this.id+'.mouseDownLi(li.fileName:"'+li.fileName+'", e:'+e+')');
    //ISPACES.log.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)ISPACES.log.debug('arguments['+i+'] = '+arguments[i]);

    //ISPACES.log.debug('li.isDir = '+li.isDir);
    if(li.isDir){
      //li.isOpen=false;
      this.toggleOpenFolder(li,e);
    }

    /*
     * Prevent the mousedown from activating a panel drag.
     * Prevent the mousedown from closing the tree.
     */
    Common.killEvent(e);
    return false;
  }

  /*
   * Handles the mouse down event on the list item in the file tree.
   */
  ,mouseDownLiBak:function(
    li
    ,e
  ){
    ISPACES.log.debug(this.id+'.mouseDownLi(li.fileName:"'+li.fileName+'", e:'+e+')');
    //ISPACES.log.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)ISPACES.log.debug('arguments['+i+'] = '+arguments[i]);

    var panelActive=this.panelCell; // Get the active panel
    //ISPACES.log.debug('panelActive = '+panelActive);

    var selectedListItems=panelActive.selectedListItems; // Get the list of selected items from the active panel.
    if(!selectedListItems)selectedListItems=panelActive.selectedListItems=[];
    //ISPACES.log.debug('selectedListItems.length = '+selectedListItems.length);

    var multipleSelected=(selectedListItems.length>1); // Are there files already selected?

    if(e&&e.ctrlKey){ // If this is a CTRL-Click operation.

      //this.toggleMultipleSelect(li);

      if(li.on){

        this.deselectLi(li);
        selectedListItems.remove(li);

      }else{

        if(!multipleSelected)selectedListItems.push(panelActive.li); // Add the previous selected li. We are doing a multiple select using the CTRL key.

        selectedListItems.push(li); // Add the list item to the array of selected items in this panel.

        // Select the list item.
        this.selectLi(li);
        /*
        li.on=true;
        //this.li=li;
        panelActive.li=li;
        li.div.setClass('selected');
        */

        //this.multipleLisSelected=true;
      }

    }else{

      if(multipleSelected){

        //this.deselectAllLis();
        for(var i=0;i<selectedListItems.length;i++){
          this.deselectLi(selectedListItems[i]);
        }

        selectedListItems.clear();

        multipleSelected=false;

      }else{

        selectedListItems.clear();

        if(panelActive.li)this.deselectLi(panelActive.li);
        /*
        if(panelActive.li){
          //this.deselectLi(panelActive.li);
          panelActive.li.on=false;
          //this.li=li;
          panelActive.li.div.setClass('');
        }
        */
      }

      // Select the list item.
      this.selectLi(li);
      /*
      li.on=true;
      //this.li=li;
      panelActive.li=li;
      li.div.setClass('selected');
      */

      // Add the list item to the array of selected items.
      //this.lis.push(li);
      selectedListItems.push(li);
      //panelActive.selectedListItems.push(li);
    }

    //ISPACES.log.debug('panelActive.selectedListItems.length = '+panelActive.selectedListItems.length);


    //ISPACES.log.debug('li.isDir = '+li.isDir);
    if(li.isDir){
      //li.isOpen=false;
      this.toggleOpenFolder(li,e);
    }

    /*
     * Prevent the mousedown from activating a panel drag.
     * Prevent the mousedown from closing the tree.
     */
    Common.killEvent(e);
    return false;
  }

  /*
  ,mouseUpLi:function(e,li){
    ISPACES.log.debug(this.id+'.mouseUpLi(e:'+e+', li.fileName:"'+li.fileName+'")');

    ISPACES.log.debug('li.isDir = '+li.isDir);
    if(li.isDir){
      //li.isOpen=false;
      //this.toggleOpenFolder(e,li);
      this.toggleOpenFolder(li,e);
    }
  }
  */

  /**
   * Selecting a folder opens the folder to reveal the sub folders.
   *
   * @param e the event object
   * @param div the DIV inside this list item that holds the icon and name.
   * @param li the list item for this file.
   */
  ,clickLi:function(
    li
    ,e
  ){
    ISPACES.log.debug(this.id+'.clickLi(li.fileName:"'+li.fileName+'", e:'+e+')');

    /*
     * Stop the event from propogating.
     * If we do not have this, the click event closes the parent folder.
     */
    Common.stopEvent(e);

    //ISPACES.log.debug('li.fileName = "'+li.fileName+'"');
    //ISPACES.log.debug('li.path = "'+li.path+'"');
    //ISPACES.log.debug('li.parent = "'+li.parent+'"');
    //ISPACES.log.debug('li.url = "'+li.url+'"');
    //if(this.pathDiv)this.pathDiv.input.value=li.path; // Set the selected path.

    /*
    if(e&&e.ctrlKey){
      ISPACES.log.debug(this.id+'.clickLi(e, div, li): e.ctrlKey = '+e.ctrlKey);

      this.toggleMultipleSelect(li);
      //this.toggleMultipleSelect(li,div);

    }else{

      //this.lis.clear();
      //this.lis.push(li);
      if(this.multipleLisSelected){
        this.deselectAllLis();
      }else{
        this.lis.clear();
        if(this.li)this.deselectLi(this.li);
      }

      this.selectLi(li);
      this.lis.push(li);

      // A little trick here.
      // Instead of checking if this folder has been opened before, we just set li.isOpen=false and call toggleOpenFolder() which takes care of everything.
      ISPACES.log.debug('li.isDir = '+li.isDir);
      if(li.isDir){
        //li.isOpen=false;
        //this.toggleOpenFolder(e,li);
        this.toggleOpenFolder(li,e);
      }
    }
    */

    // Toggle open if it is a folder.
    /*
    ISPACES.log.debug(this.id+'.clickLi(li.fileName:"'+li.fileName+'", e:'+e+'): li.isDir = '+li.isDir);
    if(li.isDir){
      //li.isOpen=false;
      //this.toggleOpenFolder(e,li);
      this.toggleOpenFolder(li,e);
    }
    */
  }

  ,toggleOpenFolder:function(li,e){
    ISPACES.log.debug(this.id+'.toggleOpenFolder(li:'+li+', e:'+e+')');
    //ISPACES.log.alert(this.id+'.toggleOpenFolder(li:'+li+', e:'+e+')');

    //var _this=this;

    var isLocal=li.isLocal
    ,protocol=li.protocol
    ,isOpen=li.isOpen
    ,ul=li.ul
    ,path=li.path
    ,origPath=li.path
    ,fileName=li.fileName
    ,refresh=li.refresh
    //,refresh=li.refresh||false
    ;

    //var panelCell=li.parentUl.panelCell;
    //ISPACES.log.debug(this.id+'.toggleOpenFolder(li:'+li+', e:'+e+'): panelCell = '+panelCell);

    /*
    ISPACES.log.debug('isLocal = '+isLocal);
    ISPACES.log.debug('protocol = '+protocol);
    ISPACES.log.debug('isOpen = '+isOpen);
    ISPACES.log.debug('ul = '+ul);
    ISPACES.log.debug('path = '+path);
    ISPACES.log.debug('origPath = '+origPath);
    ISPACES.log.debug('fileName = '+fileName);
    ISPACES.log.debug('refresh = '+refresh);
    //*/

    if(!isOpen){

      li.isOpen=true;

      if(
        ul
        &&!refresh
      ){

        ul.show();

      }else{

        /*
        //var fileMap=ISPACES.files.get(root,path,fileName);
        var fileMap=ISPACES.files.get(isLocal,protocol,path,fileName);

        //// We should only need to handle authenticate error (-1) when a user selects the root. @see createTree()
        //ISPACES.log.debug('fileMap = '+fileMap);
        //ISPACES.log.debug('(fileMap==-1) = '+(fileMap==-1));
        //if(fileMap==-1){ // fileMap returns -1, we need to authenticate
        //  this.authenticate(protocol);
        //  return;
        //}

        ISPACES.log.debug('Common.size(fileMap) = '+Common.size(fileMap));

        // The switch... the fileName becomes part of the next path
        if(path==''){
          path=fileName;
        }else{
          path=path+'/'+fileName;
        }
        ISPACES.log.debug('NEW PATH = '+path);

        //var ul=this.createTreeUl(fileMap,root,path);
        var ul=this.createTreeUl(isLocal,protocol,path,fileMap);
        //ul.boL('transparent 18px solid'); // Indent the sub folders.
        ul.maL('18px'); // Indent the sub folders.
        //li.setClass('open');
        //li.setClass('');
        li.setClass(li.cn);
        ul.li=li;
        li.ul=ul;
        li.add(ul);
        */

        var _this=this;
        var FSLASH=this.constants.FSLASH;

        var callback=function(
          isLocal
          ,protocol
          ,path
          ,fileMap
        ){
          ISPACES.log.debug('callback(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileMap:'+fileMap+')');
          //ISPACES.log.debug('Common.isString(fileMap) = '+Common.isString(fileMap));
          //ISPACES.log.debug('arguments.length = '+arguments.length);
          //for(var i=0;i<arguments.length;i++)ISPACES.log.debug('arguments['+i+'] = '+arguments[i]);

          //ISPACES.log.debug(this.id+'.toggleOpenFolder(li:'+li+', e:'+e+'): callback(fileMap:'+fileMap+')');
          //ISPACES.log.debug(this.id+'.toggleOpenFolder(li:'+li+', e:'+e+'): callback(fileMap:'+Common.size(fileMap)+')');

          //ISPACES.log.debug('path = "'+path+'"');
          //ISPACES.log.debug('(path==FSLASH) = "'+(path==FSLASH)+'"');
          //ISPACES.log.debug('fileName = "'+fileName+'"');

          /*
           * Create the new path.
           * The switch... the folder name becomes part of the next path.
           */
          //*
          var newPath;
          //if(path==FSLASH){
          if(origPath==FSLASH){
            newPath=FSLASH+fileName;
          }else{
            newPath=new ISPACES.StringBuilder([
              //path
              origPath
              ,FSLASH
              ,fileName
            ]).asString();
          }
          //*/

          /*
          var newPath=new ISPACES.StringBuilder([
            protocol
            ,this.constants.COLON
            ,path
          ]).asString();
          ISPACES.log.debug('newPath = '+newPath);
          */

          //ISPACES.log.debug('newPath = "'+newPath+'"');

          var ul=_this.createTreeUl(
            isLocal
            ,protocol
            ,newPath
            //,path
            ,fileMap
          );
          //ISPACES.log.debug('ul = '+ul);

          //ul.panelCell=panelCell; // Set a reference to the panelCell on the UL.
          ul.maL('8px'); // Indent the sub folders.
          //li.setClass('open');
          //li.setClass('');
          li.setClass(li.cn);
          ul.li=li;

          //li.add(ul);
          if( refresh){
            //li.add(ul);
            //li.replace(ul,li.childUl);
            li.replace(ul,li.ul);
            //li.replaceFirst(ul);
            //li.ul=ul;
          }else{
            li.add(ul);
          }

          li.ul=ul; // @see upArrow()
          //li.childUl=ul;
          //li.childUl=ul;

          //ISPACES.log.debug('li.ul = '+li.ul);
          //li.ul.show();
          ul.show();
          //this.openLi(li);
        };

        //ISPACES.files.getAsync(isLocal,protocol,path,fileName,callback);

        ISPACES.files.getAsync(
          isLocal
          ,protocol
          ,path
          ,fileName
          ,callback
          ,refresh
          //,false // refresh override
          //,true // refresh override
        );

      }

    }else{

      li.isOpen=false;
      if(li.ul)li.ul.hide();
      //if(li.childUl)li.childUl.hide();
      //this.closeLi(li);

    }

    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }

  ,panelMouseUp:function(panelMouseUp){
    ISPACES.log.debug(this.id+'.panelMouseUp(panelMouseUp:'+panelMouseUp+')');
  }

  ,panelMouseUpBefore:function(panelCell){
    ISPACES.log.debug(this.id+'.panelMouseUpBefore(panelCell:'+panelCell+')');

    var fileDiv=panelCell.fileDiv;
    ISPACES.log.debug('fileDiv = '+fileDiv);

    var scrollTopPrev=fileDiv.scrollTopPrev;

    var scrollTop=fileDiv.scrollTop;
    ISPACES.log.debug('scrollTop     = '+scrollTop);
    ISPACES.log.debug('scrollTopPrev = '+scrollTopPrev);
    fileDiv.scrollTopPrev=scrollTop;

    if(scrollTopPrev){
      if(scrollTopPrev!=scrollTop){
        //this.resetPositions(scrollTop);
        this.resetPositions(panelCell,scrollTop);
      }
    }
  }

  /*
   * Handles a mouedown event on the panelCell during he capturing phase.
   */
  ,panelMouseDownBefore:function(panelCell){
    ISPACES.log.debug(this.id+'.panelMouseDownBefore(panelCell:'+panelCell+')');
    //ISPACES.log.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)ISPACES.log.debug('arguments['+i+'] = '+arguments[i]);

    if(this.panelCell!=panelCell){ // only activate if it is a new selected panelCell

      this.previousPanel=this.panelCell; // set the previous panel to the current panel. @see copy()
      this.panelCell=panelCell;     // set the current panel to the mousedown panel being passed in.
      this.fileDiv=panelCell.fileDiv; // Set the active fileDiv.

      this.panelCells.forEach(function(panelCell){panelCell.setClass('panel-cell')});

      panelCell.setClass('panel-cell-active');
      //panelCell.millis=Common.millis(); // Set a timestamp on the panel. @see tabKey() Currently not being used.
      //panelCell.bo(Constants.Borders.BORE);

      /*
      var panelCellI
      ,panelCells=this.panelCells
      ,z=panelCells.length
      ,i
      ;

      for(i=0;i<z;i++){
        panelCellI=panelCells[i];
        if(panelCell!=panelCellI)panelCellI.setClass('panel-cell');
      }
      */
      //this.panelCells.forEach(function(x){
      //  if(panelCell!=x)x.setClass('panel-cell');
      //});

    }

    // If we are doing a rename and click on the panel, we need to escape the rename.
    if(ISPACES.global.escapeObject){
      ISPACES.global.escapeObject.escape();
      ISPACES.global.escapeObject=null;
      ISPACES.global.escapeKeyObject=null;
    }

  } // panelMouseDownBefore()

  /*
   * Handles the mouse down on the panel.
   */
  ,panelMouseDown:function(
    panelCell
    ,e
  ){
    ISPACES.log.debug(this.id+'.panelMouseDown(panelCell:'+panelCell+', e:'+e+')');
    //ISPACES.log.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)ISPACES.log.debug('arguments['+i+'] = '+arguments[i]);

    var panelCells=this.panelCells;

    /*
    if(this.panelCell!=panelCell){ // only activate if it is a new selected panel

      this.previousPanel=this.panelCell; // set the previous panel to the current panel. @see copy()
      this.panelCell=panelCell;     // set the current panel to the mousedown panel being passed in.
      this.fileDiv=panelCell.fileDiv; // Set the active fileDiv.

      panelCells.forEach(function(panelCell){panelCell.setClass('panel-cell')});

      panelCell.setClass('panel-cell-active');
      //panelCell.millis=Common.millis(); // Set a timestamp on the panel. @see tabKey() Currently not being used.
      //panelCell.bo(Constants.Borders.BORE);

      //this.panelCells.forEach(function(x){
      //  if(panelCell!=x)x.setClass('panel-cell');
      //});

    }

    // If we are doing a rename and click on the panel, we need to escape the rename.
    if(ISPACES.global.escapeObject){
      ISPACES.global.escapeObject.escape();
      ISPACES.global.escapeObject=null;
      ISPACES.global.escapeKeyObject=null;
    }
    */

    if(e){

      var fileDiv=panelCell.fileDiv;
      //ISPACES.log.debug('fileDiv = '+fileDiv);

      // This little snippet prevents a panel drag from occurring when the scroll bar is beign dragged.
      var scrollHeight=fileDiv.scrollHeight;
      if(scrollHeight){
        //ISPACES.log.debug('scrollHeight = '+scrollHeight);

        var clientHeight=fileDiv.clientHeight;
        //ISPACES.log.debug('clientHeight = '+clientHeight);

        var clientWidth=fileDiv.clientWidth;
        //ISPACES.log.debug('clientWidth = '+clientWidth);

        var scrolledAmount=(scrollHeight-clientHeight);
        //ISPACES.log.debug('scrolledAmount = '+scrolledAmount);

        if(scrolledAmount){ // There is a scrollbar.

          var mouseXY=Common.getMouseXY(e);
          var panelXY=Common.getXY(panelCell);
          var mouseOffset=mouseXY[0]-panelXY[0];

          //ISPACES.log.debug('mouseXY = '+mouseXY);
          //ISPACES.log.debug('panelXY = '+panelXY);
          //ISPACES.log.debug('mouseOffset = '+mouseOffset);
          //ISPACES.log.debug('clientWidth = '+clientWidth);

          if(mouseOffset>clientWidth){
            //ISPACES.log.debug('(mouseOffset:'+mouseOffset+' > clientWidth:'+clientWidth+')');
            //ISPACES.log.debug('return true;');
            return true;
          }

        }
      }

      //Common.stopEvent(e); // Prevent the drag from doing a selection.
      //Common.killEvent(e); // Prevent the drag from doing a selection.
      e.preventDefault();

      var _this=this
      ,divDrag=panelCell.div
      ,topbarDiv=panelCell.topbarDiv
      ,mouseDownX
      ;

      if(!this.dragPanelFunction){ // Sometimes the dragging gets stuck on. We check for the dragFunction to allow a double click to deactivate the dragging.

        // these both return the same result
        //ISPACES.log.debug('Common.getMouseX(e) = '+Common.getMouseX(e));
        //ISPACES.log.debug('e.pageX             = '+e.pageX);

        //mouseDownX=Common.getMouseX(e);
        mouseDownX=e.pageX;
        //ISPACES.log.debug('mouseDownX = '+mouseDownX);

        var panelWH=Common.getWH(panelCell);
        var divDragWH=Common.getWH(divDrag);
        var divDragWidth=divDragWH[0];
        var panelXY=Common.getXY(panelCell);
        var panelX=Common.getX(panelCell);
        var offsetLeft=divDrag.offsetLeft;
        var offsetRight=offsetLeft+divDragWH[0];

        /*
        ISPACES.log.debug('panelWH = '+panelWH);
        ISPACES.log.debug('divDragWH = '+divDragWH);
        ISPACES.log.debug('divDragWidth = '+divDragWidth);
        ISPACES.log.debug('panelXY = '+panelXY);
        ISPACES.log.debug('panelX = '+panelX);
        ISPACES.log.debug('offsetLeft = '+offsetLeft);
        ISPACES.log.debug('offsetRight = '+offsetRight);
        //*/

        panelCell.mouseDownX=mouseDownX;

        var p0
        ,div
        ,divs=[]
        ,z=panelCells.length
        ,i
        ,threshold=3  // the distance in pixel that dragging has to cross before a clone is created and a real drag happens.
        ,_panel=panelCell // set a reference to the event panel
        ;

        var divOffsetLeft,divOffsetRight;
        var leftDivCount=0; // Used to get the final resting position of the div being dragged.
        var divWidths=[]; // Reset the divWidths for the next drag/reposition

        // Set the thresholds of each of the other panelCells. For sliding out of position effect.
        // Measure the width of each of other divs and add them to the divWidths array.
        for(i=0;i<z;i++){
          //panelI=panelCells[p];
          p0=panelCells[i];

          if(panelCell!=p0){ // do not add the current panel

            p0.ow(Constants.Properties.VISIBLE); // Set overflow:visible on the other panelCells so that they remain visible behind the panel being dragged.

            div=p0.div;

            var divWidth=Common.getWidth(div);
            divWidths.push(divWidth);
            //ISPACES.log.debug('divWidth = '+divWidth);

            //div.movingLeft=false; // temporary fix ... movin left or right should only activate once
            //div.movingRight=false; // temporary fix ... movin left or right should only activate once
            div.hasMovedLeft=false,div.hasMovedRight=false; // These properties need to start off false.

            divOffsetLeft=div.offsetLeft;
            divOffsetRight=divOffsetLeft+divWidth;
            //ISPACES.log.debug('divOffsetLeft = '+divOffsetLeft+', divOffsetRight = '+divOffsetRight);

            div.leftThreshold=divOffsetLeft+33;
            div.rightThreshold=divOffsetRight-33;
            if(offsetLeft<divOffsetLeft){ // Is this div is to the right of the div being dragged?
              div.isRight=true;
            }else{
              div.isRight=false;
              leftDivCount++;
            }

            divs.push(div);
          }
        }
        //ISPACES.log.debug('divs.length = '+divs.length);
        //ISPACES.log.debug('leftDivCount = '+leftDivCount);

        this.divWidths=divWidths; // Set the divWidths as a property of the ap. @see panel.mouseUp()

        //divDragPositionStart=divDragPositionFinish=leftDivCount;
        //ISPACES.log.debug('divDragPositionStart = '+divDragPositionStart);
        panelCell.divDragPositionStart=panelCell.divDragPositionFinish=leftDivCount;
        //ISPACES.log.debug('panelCell.divDragPositionStart = '+panelCell.divDragPositionStart);
        //ISPACES.log.debug('panelCell.divDragPositionFinish = '+panelCell.divDragPositionFinish);

        ISPACES.global.mouseUpObject=_this;

        // To check the direction of the drag.
        var movingRight=false;
        var prevX=mouseDownX;

        Common.addListener(
          document
          ,Constants.Events.MOUSEMOVE
          //,panelCell.dragPanelFunction=function(e0){
          ,this.dragPanelFunction=function(e0){
            //ISPACES.log.debug('dragPanelFunction(e0:'+e0+')');

            e0.preventDefault();

            //var mouseX=Common.getMouseX(e);
            var mouseX;
            if(ISPACES.isTouchDevice){
              mouseX=e0.touches[0].pageX;
              touchEndX=mouseX;
            }else{
              mouseX=e0.pageX;
            }
            var movedX=mouseX-mouseDownX;
            //ISPACES.log.debug('mouseDownX = '+mouseDownX+', mouseX = '+mouseX+', movedX = '+movedX);

            if(
              movedX>=threshold
              ||movedX<=-threshold
            ){

              if(!panelCell.draggingStarted){
                //ISPACES.log.debug('panelCell.draggingStarted = '+panelCell.draggingStarted);

                //panelCell.draggingStarted=true;
                this.draggingStarted=true;

                //ISPACES.log.warn('dragPanelFunction(e0:'+e0+'): _this.dragCell=divTable; Do we need this?');
                //_this.dragCell=divTable;

                // Set the width/height of the panel so that it remains the same size after the inner div is removed.
                // Set the min-width on the panel so it does not automatically change size when the inner div is removed.
                // This may not be required when we are doing relative positioning.
                //panelCell.wihi(panelWH[0],panelWH[1]);
                panelCell.wi(panelWH[0]);
                //panelCell.maWi(panelWH[0]);
                panelCell.miWi(panelWH[0]);

                //
                // IMPORTANT - The enclosing panel needs overflow:visible for the relative positioning to work.
                //
                panelCell.ow(Constants.Properties.VISIBLE);

                //
                // Set the width/height of the div being dragged.
                // This may not be required for relative positioning.
                //divDrag.wihi(divDragWH[0],divDragWH[1]);

                //
                // Bring the div being dragged to the front.
                //
                divDrag.toFront();
                //divDrag.toFront1();

                //
                // Re-style the panel as it is being dragged.
                //
                //ISPACES.ui.shadow0(divDrag);
                //ISPACES.ui.borderRadius(divDrag,8);
                divDrag.setClass('panel-dragged');
              }

              // Now that the threshold has been reached and the div cloned, remove the mousemove listener and replace it with the most efficient handler without any if/else statements.
              Common.removeListener(
                document
                ,Constants.Events.MOUSEMOVE
                //,panelCell.dragPanelFunction
                //,this.dragPanelFunction
                ,_this.dragPanelFunction
                ,false
              );

              Common.addListener(
                document
                ,Constants.Events.MOUSEMOVE
                ,_this.dragPanelFunction=function(e1){ // this == div
                //,this.dragPanelFunction=function(e1){ // this == div
                  ISPACES.log.debug('dragPanelFunction(e1:'+e1+')');

                  //*
                  //var mouseXY=Common.getMouseXY(e1);
                  //movedX=(mouseXY[0]-mouseDownX);
                  var mouseX;
                  if(ISPACES.isTouchDevice){
                    mouseX=e1.touches[0].pageX;
                    touchEndX=mouseX;
                  }else{
                    mouseX=e1.pageX;
                  }
                  //ISPACES.log.debug('startX = '+startX);
                  //ISPACES.log.debug('mouseX = '+mouseX);
                  var movedX=mouseX-mouseDownX;
                  //ISPACES.log.debug('movedX = '+movedX);

                  //ISPACES.log.debug('mouseDownX = '+mouseDownX+', mouseX = '+mouseX+', prevX = '+prevX);

                  //if(mouseX>=prevX){
                  if(mouseX>(prevX+20)){
                    movingRight=true;
                    prevX=mouseX;
                  //}else{
                  }else if(mouseX<(prevX-20)){
                    movingRight=false;
                    prevX=mouseX;
                  }
                  //ISPACES.log.debug('movingRight = '+movingRight);

                  // The new right/left border X positions.
                  var leftBorder=offsetLeft+movedX,rightBorder=offsetRight+movedX;
                  //ISPACES.log.debug('leftBorder = '+leftBorder+', rightBorder = '+rightBorder);

                  var leftThreshold,rightThreshold,isRight=false;

                  //
                  // Check the other panelCells to see if they need sliding out of position.
                  //
                  for(var i=0;i<divs.length;i++){
                    //ISPACES.log.debug('divs['+i+'] = '+divs[i]);

                    div=divs[i];
                    isRight=div.isRight,leftThreshold=div.leftThreshold,rightThreshold=div.rightThreshold;

                    //ISPACES.log.debug(i+' - isRight = '+isRight+', leftThreshold = '+leftThreshold+', rightThreshold = '+rightThreshold);

                    //ISPACES.log.debug(i+' - movingRight = '+movingRight);
                    //ISPACES.log.debug(i+' - div.hasMovedLeft = '+div.hasMovedLeft);
                    if(movingRight){
                      //ISPACES.log.debug('movingRight');

                      if(isRight){ // If the div is to the right, then it can move left.
                        if(!div.hasMovedLeft){
                          //ISPACES.log.debug(i+' - !div.hasMovedLeft');
                          //ISPACES.log.info(i+' - (rightBorder>leftThreshold) = ('+rightBorder+'>'+leftThreshold+') = '+(rightBorder>leftThreshold));

                          if(rightBorder>leftThreshold){ // The right border crossed the left offset.
                            //ISPACES.log.info(i+' - The right border crossed the left offset.');
                            //ISPACES.log.debug(i+' - rightBorder:'+rightBorder+' > leftThreshold:'+leftThreshold);

                            //div.lt(-divDragWH[0]); // Non-animated movement.
                            div.hasMovedLeft=true;
                            //divDragPositionFinish++;
                            panelCell.divDragPositionFinish++;
                            if(!div.movingLeft)_this.moveLeft(div,0,-(divDragWH[0]+_this.grabberWidth)); // Animated sliding effect.

                          }
                        }
                      }

                      if(div.hasMovedRight){
                        //ISPACES.log.debug(i+' - div.hasMovedRight');
                        if(leftBorder>rightThreshold){ // The left border crossed back over the right offset.
                          //ISPACES.log.info(i+' - (leftBorder>rightThreshold) = ('+leftBorder+'>'+rightThreshold+') = '+(leftBorder>rightThreshold));
                          //ISPACES.log.info(i+' - The left border crossed back over the right offset.');
                          //ISPACES.log.debug('leftBorder:'+leftBorder+' > rightThreshold:'+rightThreshold);

                          //div.lt(0); // Non-animated movement.

                          div.hasMovedRight=false;
                          //divDragPositionFinish++;
                          panelCell.divDragPositionFinish++;
                          if(!div.movingLeft)_this.moveLeft(div,divDragWH[0],0); // Animated sliding effect.

                        }
                      }

                    }else{ // i.e. moving left
                    //}if(!movingRight){
                      //ISPACES.log.debug('!movingRight');

                      if(!isRight){ // If the div is to the left, then it does not move left.
                        if(!div.hasMovedRight){
                          //ISPACES.log.debug(i+' - !div.hasMovedRight');
                          //ISPACES.log.debug(i+' - if(leftBorder:'+leftBorder+' < rightThreshold:'+rightThreshold+')');
                          //ISPACES.log.info(i+' - (leftBorder<rightThreshold) = ('+leftBorder+'<'+rightThreshold+') = '+(leftBorder<rightThreshold));
                          if(leftBorder<rightThreshold){ // The left border crossed the right offset.
                            //ISPACES.log.info(i+' - The left border crossed the right offset.');
                            //ISPACES.log.debug('leftBorder:'+leftBorder+' < rightThreshold:'+rightThreshold);

                            //div.lt(divDragWH[0]); // Non-animated movement.

                            div.hasMovedRight=true;
                            //divDragPositionFinish--;
                            panelCell.divDragPositionFinish--;
                            if(!div.movingRight)_this.moveRight(div,0,(divDragWH[0]+_this.grabberWidth)); // Animated sliding effect.

                          }
                        }
                      }

                      if(div.hasMovedLeft){
                        //ISPACES.log.debug(i+' - div.hasMovedLeft');
                        //ISPACES.log.info(i+' - (rightBorder<leftThreshold) = ('+rightBorder+'<'+leftThreshold+') = '+(rightBorder<leftThreshold));
                        if(rightBorder<leftThreshold){ // The right border crossed back over the left offset.
                          //ISPACES.log.info(i+' - The right border crossed back over the left offset.');
                          //ISPACES.log.debug('rightBorder:'+rightBorder+' < leftThreshold:'+leftThreshold);

                          //div.lt(0); // Non-animated movement.

                          div.hasMovedLeft=false;
                          //divDragPositionFinish--;
                          panelCell.divDragPositionFinish--;
                          if(!div.movingRight)_this.moveRight(div,(-divDragWH[0]),0); // Animated sliding effect.

                        }
                      }

                    } // if(movingRight)

                  } // for(var i=0;i<divOffsets.length;i++)

                  //if(newX>divMainXY[0]){ // prevent the panel for going past the left side of the app
                  //  divDrag.lt(newX);
                  //}else{
                  //  divDrag.lt(divMainXY[0]);
                  //}
                  divDrag.lt(movedX);

                }
                ,false
              );

            } // if(movedX>=threshold || movedX<=-threshold){

          } // ,_panelCell.dragPanelFunction=function(e0) {

          ,false
        ); // Common.addListener(document,Constants.Events.MOUSEMOVE,function,false)

      } // if(!_this.dragPanelFunction)
    } // if(e)
  } // panelMouseDown()


  /*
   * Moving home, after a failed drag & drop reposition.
   */
  ,moveHome:function(div,fromX){
    ISPACES.log.debug(this.id+'.moveHome('+div+', fromX:'+fromX+')');

    div.fromX=fromX;
    var movingHome;
    if(fromX>0){
      movingHome=new ISPACES.AsyncApplyer(this,this.leftHomeMover,[div],5);
    }else{
      movingHome=new ISPACES.AsyncApplyer(this,this.rightHomeMover,[div],5);
    }
    div.movingHome=movingHome;
  }

  ,leftHomeMover:function(div){
    //ISPACES.log.debug(this.id+'.leftHomeMover('+div+')');
    var x=div.fromX-=5;
    //ISPACES.log.debug(this.id+'.leftHomeMover(div): x = '+x);
    if(x<=0){
      x=0;
      div.movingHome.stop();
    }
    div.lt(x);
  }

  ,rightHomeMover:function(div){
    //ISPACES.log.debug(this.id+'.rightHomeMover('+div+')');
    var x=div.fromX+=5;
    //ISPACES.log.debug(this.id+'.rightHomeMover(div): x = '+x);
    if(x>=0){
      x=0;
      div.movingHome.stop();
    }
    div.lt(x);
  }

  /*
   * Moving from - to
   */
  ,moveTo:function(div,toX,fromX){
    ISPACES.log.debug(this.id+'.moveTo('+div+', toX:'+toX+', fromX:'+fromX+')');

    div.toX=toX;
    div.fromX=fromX;

    var movingTo;
    if(toX<fromX){
      movingTo=new ISPACES.AsyncApplyer(this,this.leftToMover,[div],5);
    }else{
      movingTo=new ISPACES.AsyncApplyer(this,this.rightToMover,[div],5);
    }
    div.movingTo=movingTo;
  }

  ,leftToMover:function(div){
    //ISPACES.log.debug(this.id+'.leftToMover('+div+')');
    var x=div.fromX-=35;
    //ISPACES.log.debug(this.id+'.leftToMover(div): x = '+x);
    if(x<=div.toX){
      x=div.toX;
      //div.movingTo.stop();
      div.lt(x);
      this.clearMovingTo(div);
      return;
    }
    div.lt(x);
  }

  ,rightToMover:function(div){
    //ISPACES.log.debug(this.id+'.rightToMover('+div+')');
    var x=div.fromX+=35;
    //ISPACES.log.debug(this.id+'.rightToMover(div): x = '+x);
    if(x>=div.toX){
      x=div.toX;
      //div.movingTo.stop();
      div.lt(x);
      this.clearMovingTo(div);
      return;
    }
    div.lt(x);
  }

  /*
   * Reset the panels after "moving to" a new position.
   */
  ,clearMovingTo:function(div){
    ISPACES.log.debug(this.id+'.clearMovingTo('+div+')');

    div.movingTo.stop();

    /*
     * After the panel has finished dragging, we reset overflow:hidden on the panel.
     */
    //var panelCell=div.panel;
    var panelCell=div.panelCell;
    //ISPACES.log.debug('panelCell = '+panelCell);
    panelCell.ow(Constants.Properties.HIDDEN);

    var position=div.position;
    div.position=null; // Remove the position for the next drag.

    //ISPACES.log.debug('position = '+position);
    //ISPACES.log.debug('this.panelCells.length = '+this.panelCells.length);

    var a=[];

    //div.lt(0);
    //div.setClass('panel'); // Reset the className
    //div.style.left=this.constants.EMPTY;

    //var panelAtPosition=this.panelCells[position];
    //ISPACES.log.debug('panelAtPosition = '+panelAtPosition);

    //this.panelCells.splice(div.panel.i,1); // remove the panel being dragged from the panelCells array
    this.panelCells.splice(div.panelCell.i,1); // remove the panel being dragged from the panelCells array
    //this.panelCells.splice(position,0,div.panel); // add the panel being dragged at the new position
    this.panelCells.splice(position,0,div.panelCell); // add the panel being dragged at the new position

    //ISPACES.log.debug('this.panelCells.length = '+this.panelCells.length);

    for(var i=0;i<this.panelCells.length;i++){
      //ISPACES.log.debug('this.panelCells['+i+'] = '+this.panelCells[i]);

      panelCell=this.panelCells[i];
      //ISPACES.log.debug('panelCell.i = '+panelCell.i);

      // Reset the panelCell.
      panelCell.i=i;
      //panelCell.div.wiphip(100); // Reset the width/height of the div.
      panelCell.div.rel(0);
      panelCell.div.lt(0);
      panelCell.div.setClass('panel'); // Reset the className
      panelCell.div.wi('');
      panelCell.ow(Constants.Properties.HIDDEN);
      panelCell.style.minWidth=this.constants.EMPTY; // Remove the min-width setting on the panelCell
      //panelCell.dragCell.replaceFirst(this.create.txt(i)); // temporary for development

      if(i>0)a.push(this.createCenterGrabber());

      a.push(panelCell);
    }

    // Recreate the panelCell row and replace it.
    var panelRow=this.create.divRow(a);
    this.divMain.replace(panelRow,this.panelRow);
    this.panelRow=panelRow;

    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }

  /*
   * Moving left
   */
  ,moveLeft:function(div,toX,fromX){
    //ISPACES.log.debug(this.id+'.moveLeft('+div+', toX:'+toX+', fromX:'+fromX+')');
    div.toX=toX;
    div.fromX=fromX;
    //div.movingLeft=true;
    div.movingLeft=new ISPACES.AsyncApplyer(this,this.leftMover,[div],5);
  }

  //,mover:function(div,offset){
    //ISPACES.log.debug(this.id+'.mover('+div+', '+offset+')');
  ,leftMover:function(div){
    //ISPACES.log.debug(this.id+'.leftMover('+div+')');
    var x=div.toX-=75;
    //ISPACES.log.debug(this.id+'.leftMover(div): x = '+x);
    if(x<=div.fromX){
      x=div.fromX;
      this.clearLeftMoving(div);
    }
    div.lt(x);
  }

  ,clearLeftMoving:function(div){
    //ISPACES.log.debug(this.id+'.clearLeftMoving('+div+')');
    div.movingLeft.stop();
    //div.movingLeft=false;
    div.movingLeft=null;
    //div.hasMovedLeft=true;
    //div.hasMovedRight=false;
  }

  /*
   * Moving right
   */
  ,moveRight:function(div,toX,fromX){
    //ISPACES.log.debug(this.id+'.moveRight('+div+', toX:'+toX+', fromX:'+fromX+')');
    div.toX=toX;
    div.fromX=fromX;
    //div.movingRight=true;
    div.movingRight=new ISPACES.AsyncApplyer(this,this.rightMover,[div],5);
  }

  ,rightMover:function(div){
    //ISPACES.log.debug(this.id+'.rightMover('+div+')');
    var x=div.toX+=75;
    //ISPACES.log.debug(this.id+'.rightMover(): x = '+x);
    if(x>=div.fromX){
      x=div.fromX;
      this.clearRightMoving(div);
    }
    div.lt(x);
  }

  ,clearRightMoving:function(div){
    //ISPACES.log.debug(this.id+'.clearRightMoving('+div+')');
    div.movingRight.stop();
    //div.movingRight=false;
    div.movingRight=null;
    //div.hasMovedRight=true;
    //div.hasMovedLeft=false;
  }

  /**
   * Selecting a folder opens the folder to reveal the sub folders.
   *
   * @param e the event object
   * @param div the DIV inside this list item that holds the icon and name.
   * @param li the list item for this file.
   */
  ,selectFile:function(e,div,li){
  }

  ,toggleMultipleSelect:function(li){
    ISPACES.log.debug(this.id+'.toggleMultipleSelect(li.fileName:'+li.fileName+')');

    ISPACES.log.debug('li.on = '+li.on);

    if(li.on){

      this.deselectLi(li);
      this.lis.remove(li);

    }else{
      //li.on=true;

      if(!this.multipleLisSelected){
        this.lis.push(this.li); // Add the previous selected li. We are doing a multiple select using the CTRL key.
      }

      this.lis.push(li);
      this.selectLi(li);
      this.multipleLisSelected=true;
    }

    //ISPACES.log.debug(this.id+'.toggleMultipleSelect(li): this.selectedFiles.size() = '+this.selectedFiles.size());
  }

  ,deselectAllLis:function(){
    //ISPACES.log.debug(this.id+'.deselectAllLis()');

    //ISPACES.log.debug('this.lis.length = '+this.lis.length);

    for(var i=0;i<this.lis.length;i++){
      this.deselectLi(this.lis[i]);
    }
    this.multipleLisSelected=false;
    this.lis.clear();
    //this.li=null;
  }

  ,selectLi:function(li){
    //ISPACES.log.debug(this.id+'.selectLi(li.fileName:'+li.fileName+')');
    //ISPACES.log.debug(this.id+'.selectLi(li.fileName:'+li.fileName+'): li.url = '+li.url);

    /*
    var liSelected=this.li;
    ISPACES.log.debug('liSelected = '+liSelected);

    //if(this.multipleLisSelected){
    if(liSelected){
      this.lis.push(li);
      this.multipleLisSelected=true;
    }
    */

    //li.scrollIntoView();
    li.on=true;
    //this.lis.push(li);
    //ISPACES.log.debug(this.id+'.selectLi(li): this.lis.length = '+this.lis.length);
    this.li=li;
    //this.panel.li=li;
    this.panelCell.li=li;
    //li.bo(Constants.Borders.BORE);

    /*
    this.lis.push(li);
    ISPACES.log.debug(this.id+'.selectLi('+li+'): this.lis.length = '+this.lis.length);
    if(this.lis.length>1){
      this.multipleLisSelected=true;
    }
    //*/

    /*
    ISPACES.log.debug(this.id+'.selectLi(li): this.leftRight.id = '+this.leftRight.id);
    //this.left.li=li;
    //this.left.url=li.url;
    this.leftRight.root=li.root;
    this.leftRight.li=li;
    this.leftRight.url=li.url;
    this.leftRight._size=li._size;
    this.leftRight.isLocal=li.root.isLocal;
    ISPACES.log.debug(this.id+'.selectLi(li): this.leftRight.url = '+this.leftRight.url+', this.leftRight.isLocal = '+this.leftRight.isLocal);
    ISPACES.log.debug(this.id+'.selectLi(li): this.left.url = '+this.left.url+', this.right.url = '+this.right.url);
    */

    //li.setClass('selected');
    //li.addAll('selected');
    //li.span.setClass('selected');
    li.div.setClass('selected');

    //li.fileDiv.setClass('selected');
    //if(this.cell)this.cell.tree.li=li; // Set the selected LI as a property of its tree.
  }

  ,deselectLi:function(li){
    //ISPACES.log.debug(this.id+'.deselectLi(li.fileName:'+li.fileName+')');
    //ISPACES.log.debug(this.id+'.deselectLi(li.fileName:'+li.fileName+'): li.url = '+li.url);

    /*
    if(this.multipleLisSelected){
      this.deselectAllLis();
      return;
    }
    */

    li.on=false;

    //this.li=li;
    //this.panel.li=li;
    //this.panel.li=null;
    this.panelCell.li=null;

    //li.dCN('selected');
    //li.setClass('');
    //li.setClass(li.cn);
    //li.span.setClass('');
    li.div.setClass('');

    //this.lis.remove(li);
    //ISPACES.log.debug(this.id+'.deselectLi(li): this.lis.length = '+this.lis.length);
    //li.fileDiv.setClass('file');  // Deselect the previous selected folder
  }

  ,sortByMillis:function(a,b){
    //ISPACES.log.debug(this.id+'.sortByMillis('+a+', '+b+')');
    a=a.millis,b=b.millis;
    //ISPACES.log.debug('a = '+a+', b = '+b);
    return (a>b?-1:a<b?1:0);
  }

  /*
  ,toggleDock:function(){
    ISPACES.log.alert(this.id+'.toggleDock()');
    if(this.docked){
      this.docked=false;
      this.resizableWindow.show();
    }else{
      this.resizableWindow.hide();
      this.docked=true;
    }
    return this.docked;
  }
  */

  /*
   * Maximize, Minimize, Restore, Snap
   */

  /*
  ,show:function(){
    ISPACES.log.debug(this.id+'.show()');

    ISPACES.log.debug('this.minimized = '+this.minimized);
    ISPACES.log.debug('this.resizableWindow.minimized = '+this.resizableWindow.minimized);

    this.windowDiv.show();
  }

  ,hide:function(){
    ISPACES.log.debug(this.id+'.hide()');

    ISPACES.log.debug('this.minimized = '+this.minimized);
    ISPACES.log.debug('this.resizableWindow.minimized = '+this.resizableWindow.minimized);

    this.windowDiv.hide();
  }

  ,minimize:function(){
    ISPACES.log.debug(this.id+'.minimize()');

    ISPACES.log.debug('this.isTop = '+this.isTop);

    this.minimized=true;

    //this.resizableWindow.minimize();

    //if(!this.resizableWindow.minimized){ // If the window is minimized, do nothing.
    //  //escape();
    //  //this.resizableWindow.hid();
    //}
    this.windowDiv.hide();

  }

  ,unMinimize:function(){
    ISPACES.log.debug(this.id+'.unMinimize()');

    ISPACES.log.debug('this.isTop = '+this.isTop);

    this.minimized=false;

    //this.resizableWindow.unMinimize();
    //this.resizableWindow.hide();
    this.windowDiv.show();


    //this.show();
    //this.visible();
    //this.toFront();

    //if(ISPACES.system.isShim)ISPACES.spaces.space.unMinimized(this.ap); // We need to show any shims.

    //this.windowControl.minimized=false;
  }
  */

  ,maximize:function(){
    ISPACES.log.debug(this.id+'.maximize()');

    /*
     * At this point the apDiv is already maximized, so we cannot measure the apDiv width here.
     * The adDiv width is now measured in the function setDimensions().
     *
    this.apDiv._wh=Common.getWH(this.apDiv);
    ISPACES.log.debug(this.id+'.maximize(): this.apDiv._wh = '+this.apDiv._wh);
    ISPACES.log.alert(this.id+'.maximize(): this.apDiv._wh = '+this.apDiv._wh);
     */

    /*
     * At this point the divMain is NOT maximized, although it is already measured in setDimensions().
     *
    this.divMain._wh=Common.getWH(this.divMain);
    ISPACES.log.debug(this.id+'.maximize(): this.divMain._wh = '+this.divMain._wh);
    ISPACES.log.alert(this.id+'.maximize(): this.divMain._wh = '+this.divMain._wh);
     */

    var panelCount=this.panelCells.length;
    //ISPACES.log.debug('panelCount = '+panelCount);
    this.panelCount=panelCount;

    //* this.divMain
    //ISPACES.log.alert(this.id+'.maximize(): this.divMain.bo('+Constants.Borders.GREEN+')');
    //this.divMain.bo(Constants.Borders.GREEN);
    //this.divMain.bo('green 5px solid');
    //ISPACES.log.alert(this.id+'.maximize(): this.divMain.wiphip(100)');
    this.divMain.wiphip(100);
    //*/

    //* this.divTable
    //this.divTable.bo(Constants.Borders.BOBL);
    //ISPACES.log.alert(this.id+'.maximize(e): this.divTable.bo(\'blue 5px solid\')');
    //this.divTable.bo('blue 5px solid');
    //this.divTable.bo(Constants.Borders.BOBL);
    //ISPACES.log.alert(this.id+'.maximize(e): this.divTable.wiphip(100)');
    //this.divTable.wiphip(100);
    //ISPACES.log.alert(this.id+'.maximize(e): this.divTable.di(\'block\')');
    //this.divTable.di('block');
    //*/


    //* this.apDiv
    //ISPACES.log.alert(this.id+'.maximize(): this.apDiv.bo(\'black 5px solid\')');
    //this.apDiv.bo('black 5px solid');
    //ISPACES.log.alert(this.id+'.maximize(): this.apDiv.bo('+Constants.Borders.BLACK+')');
    //this.apDiv.bo(Constants.Borders.BLACK);
    //ISPACES.log.alert(this.id+'.maximize(): this.apDiv.wiphip(100)');
    this.apDiv.wiphip(100);
    //ISPACES.log.alert(this.id+'.maximize(): this.apDiv.di(\'block\')');
    //this.apDiv.di('block');
    //*/

    //ISPACES.log.debug('Common.getWH(this.divMain) = '+Common.getWH(this.divMain));
    //ISPACES.log.debug('Common.getWH(this.apDiv) = '+Common.getWH(this.apDiv));
    //ISPACES.log.debug('Common.getWH(this.windowDiv) = '+Common.getWH(this.windowDiv));

    var apDivWH=Common.getWH(this.apDiv);
    //var newWidth=Common.getWidth(this.apDiv);
    //ISPACES.log.debug('apDivWH = '+apDivWH);

    //this.resetPanels();
    //this.adjustPanels(newWidth);
    this.wi(apDivWH[0]);
    this.hi(apDivWH[1]);

    /*
    var padHeight=ISPACES.ui.taskbar.wh[1];
    ISPACES.log.debug(this.id+'.createAp(): padHeight = '+padHeight);

    //ISPACES.log.alert(this.id+".maximize(): this.padRow.di("+Constants.Properties.TABLEROW+")");
    //this.padRow.di(Constants.Properties.TABLEROW);
    this.resizableWindow.s.setClass('s8');
    this.resizableWindow.s.di('block');
    this.resizableWindow.s.hi(padHeight);
    this.resizableWindow.s.miHi(padHeight);
    */

    /*
    this.padRow.hi(padHeight);
    this.padRow.miHi(padHeight);
    this.padRow.divPad.hi(padHeight);
    this.padRow.divPad.miHi(padHeight);
    //*/

    //this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
  }

  ,resetPanels:function(){
    ISPACES.log.debug(this.id+'.resetPanels()');

    //var h=Common.getHeight(this.divMain);
    //ISPACES.log.alert(this.id+'.resetPanels(): h = '+h);
    var wh=Common.getWH(this.divMain);
    //var wh=this.divMain._wh=Common.getWH(this.divMain);
    //var wh=this.divMain._wh;
    //ISPACES.log.debug('wh = '+wh);

    var h=wh[1]-33;
    //var h=wh[1];

    //this.adjustFileDivHeights(h);

    var panelCell
    ,fileDiv
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ,i
    ;

    var totalWidth=0;

    for(i=0;i<z;i++){

      panelCell=panelCells[i]
      ,fileDiv=panelCell.fileDiv
      ;

      fileDiv._wh=Common.getWH(fileDiv);
      //ISPACES.log.debug('fileDiv._wh = '+fileDiv._wh);

      /*
      var panelW=Common.getWidth(panelCell);
      */
      var panelWH=panelCell._wh=Common.getWH(panelCell);
      //ISPACES.log.debug('panelWH = '+panelWH);
      var panelW=panelWH[0];
      //ISPACES.log.debug('panelW = '+panelW);

      //panelCell.fileDiv.wi(panelW-8);
      //fileDiv.wi(panelW);
      //fileDiv.hi(h);
      fileDiv.wihi(panelW,h);

      //totalWidth+=panelW;

      //fileDiv=panelCell.fileDiv;
      //ISPACES.log.debug('fileDiv.hi('+h+')');
      //fileDiv.hi(h);
    }
    //ISPACES.log.debug(this.id+'.resetPanels(): totalWidth = '+totalWidth);

    /*
    for(i=0;i<z;i++){
      panelCell=panelCells[i];
      var panelW=Common.getWidth(panelCell);
      ISPACES.log.debug(this.id+'.resetPanels(): panelW = '+panelW);
      var panelWidth=(panelW/totalWidth)*100;
      ISPACES.log.debug(this.id+'.resetPanels(): panelWidth = '+panelWidth);

      panelCell.bo('red 1px solid');
      panelCell.div.bo('blue 1px solid');


      //panelCell.wi(''),panelCell.maWi(''); // maWi() allows the overflow to work.
      panelCell.wip(panelWidth);
      //panelCell.style.maxWidth=panelWidth+'%';
      //panelCell.fileDiv.wi(newWidth);
      //panelCell.fileDiv.wip(100);
      //panelCell.div.wip(100);
      //panelCell.fileDiv.wip(100);
    }
    */

    //this.wi(wh[0]);

    /*
    //this.resizableWindow.divCenter

    var wh=Common.getWH(this.resizableWindow.divCenter);
    ISPACES.log.debug(this.id+'.resetPanels(): wh = '+wh);
    ISPACES.log.alert(this.id+'.resetPanels(): wh = '+wh);

    //this.divMain.hi(wh[1]);
    this.resizableWindow.divMain.hi(wh[1]);
    //this.divMain.miHi(wh[1]);

    //this.panelCells[0].hi(wh[1]);
    */
  }

  ,restorePanels:function(){
    ISPACES.log.debug(this.id+'.restorePanels()');

    var wh=this.divMain._wh;
    //ISPACES.log.debug('wh = '+wh);
    //var h=wh[1];

    var panelCell
    ,fileDiv
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ,i
    ;

    for(i=0;i<z;i++){

      panelCell=panelCells[i]
      ,panelWH=panelCell._wh
      ,fileDiv=panelCell.fileDiv
      ,fileDivWH=fileDiv._wh
      ;

      //ISPACES.log.debug(this.id+'.restorePanels(): panelWH = '+panelWH);
      //ISPACES.log.debug(this.id+'.restorePanels(): fileDivWH = '+fileDivWH);

      //ISPACES.log.debug('fileDiv.wi(panelWH[0]:'+panelWH[0]+')');
      //fileDiv.wi(panelWH[0]);
      //fileDiv.maWi(panelWH[0]);
      fileDiv.wihi(fileDivWH[0],fileDivWH[1]);

      //var fileDivWH=fileDiv._wh;
      //ISPACES.log.debug('fileDivWH = '+fileDivWH);
      //fileDiv.hi(h);
      //ISPACES.log.debug('fileDiv.hi(fileDivWH[1]:'+fileDivWH[1]+')');
      //fileDiv.hi(fileDivWH[1]);
    }

    //this.wi(wh[0]);
  }

  ,restore:function(){
    ISPACES.log.debug(this.id+'.restore()');

    var apWidth=this.apDiv._wh[0];
    //ISPACES.log.debug(this.id+'.restore(): apWidth = '+apWidth);

    var apDivWH=this.apDiv._wh;
    //ISPACES.log.debug(this.id+'.restore(): apDivWH = '+apDivWH);

    //this.resizableWindow.pad(3); // Reset the window padding.

    // Reset the divMain width/height.
    //this.divMain.wihi(this.divMain._wh[0],this.divMain._wh[1]); // Shift the divMain back into its original dimensions,
    //ISPACES.ui.unsetWH(this.divMain); // then, unset the width/height setting.

    //ISPACES.log.alert(this.id+'.restore(): ISPACES.ui.unsetWH(this.divTable)');
    //ISPACES.ui.unsetWH(this.divTable); // If the divTable is not the same element as divMain, we have to unset it as well.

    /*
    // Reset the leftDiv and rightDiv width/height.
    ISPACES.log.debug(this.id+'.restore(): if(this.leftDiv.wh)this.leftDiv.hi('+this.leftDiv.wh[1]+')');
    //if(this.leftDiv.wh)this.leftDiv.hi(this.leftDiv.wh[1]);
    //if(this.rightDiv.wh)this.rightDiv.hi(this.rightDiv.wh[1]);
    if(this.leftDiv.wh)this.leftDiv.wihi(this.leftDiv.wh[0],this.leftDiv.wh[1]);
    if(this.rightDiv.wh)this.rightDiv.wihi(this.rightDiv.wh[0],this.rightDiv.wh[1]);
    //ISPACES.ui.unsetWH(this.leftDiv);
    //ISPACES.ui.unsetWH(this.rightDiv);
    //ISPACES.log.alert(this.id+'.restore(): ISPACES.ui.unsetH(this.leftDiv)');
    //ISPACES.ui.unsetH(this.leftDiv);
    //ISPACES.ui.unsetH(this.rightDiv);
    ISPACES.ui.unsetH(this.leftDiv);
    ISPACES.ui.unsetH(this.rightDiv);

    // Reset the leftFileDiv and rightFileDiv height only.
    //this.leftFileDiv.wihi(this.leftFileDiv.wh[0],this.leftFileDiv.wh[1]);
    //this.rightFileDiv.wihi(this.rightFileDiv.wh[0],this.rightFileDiv.wh[1]);
    this.leftFileDiv.hi(this.leftFileDiv.wh[1]);
    this.rightFileDiv.hi(this.rightFileDiv.wh[1]);
    */

    //this.padRow.di(Constants.Properties.NONE);
    //ISPACES.ui.unsetH(this.resizableWindow.s);
    //this.resizableWindow.s.hi(8);
    //this.resizableWindow.s.miHi(8);
    //this.resizableWindow.s.hi('');
    //this.resizableWindow.s.miHi('');
    //this.resizableWindow.s.hi('none');
    //this.resizableWindow.s.miHi('none');
    //this.resizableWindow.s.setClass('s8');
    //this.resizableWindow.s.hi(padHeight);
    //this.resizableWindow.s.miHi(padHeight);

    //this.restorePanels();
    var panelCount=this.panelCells.length;
    //ISPACES.log.debug('panelCount = '+panelCount);

    //ISPACES.log.debug('(panelCount!=this.panelCount) = '+(panelCount!=this.panelCount));

    /*
    if(panelCount!=this.panelCount){

      //this.adjustPanel();
      //var divMainWidth=this.divMain._wh[0];
      //this.wi(divMainWidth);
      //this.adjustPercentageWidths(divMainWidth);
      //this.adjustPanels(divMainWidth);

      //var totalWidth=divMainWidth;
      var totalWidth=this.divMain.w;
      ISPACES.log.debug('totalWidth = '+totalWidth);

      var panelCell
      ,panelCells=this.panelCells
      ,fileDiv
      ,i
      ,z=panelCells.length
      ,w
      ,h=this.fileDivH
      ;

      for(i=0;i<z;i++){

        panelCell=panelCells[i]
        ,fileDiv=panelCell.fileDiv
        //,fileDivWH=fileDiv._wh
        ,fileDivWH=this.fileDivH
        ;

        w=totalWidth/z;
        ISPACES.log.debug('w = '+w);
        panelCell.wi(w),panelCell.maWi(w); // set the panel width
        panelCell.w=w;
        //fileDiv.wi((panelCell.w-7));               // set the fileDiv width for overflow hidden
        //fileDiv.wihi((panelCell.w-7),fileDivWH[1]);               // set the fileDiv width for overflow hidden
        fileDiv.wihi((panelCell.w-7),h);               // set the fileDiv width for overflow hidden
      }

    }else{

      //this.restorePanels();

      //this.adjustPanels(apWidth); // the restored width
      this.wi(apDivWH[0]); // the restored width
      this.hi(apDivWH[1]); // the restored height
    }
    */
    this.wi(apDivWH[0]); // the restored width
    this.hi(apDivWH[1]); // the restored height

    //this.draggableAp.addMouseDown(); // Re-add the ability to drag the window.
  }

/*
  ,snapTopLeft:function(){
    //ISPACES.log.alert(this.id+'.snapTopLeft()');

    this.apDiv._wh=Common.getWH(this.apDiv); // Save the apDiv width/height for restore.
    this.divMain._wh=Common.getWH(this.divMain); // Save the divMain width/height for restore.
    //ISPACES.log.debug(this.id+'.snapTopLeft(): this.apDiv._wh[0]='+this.apDiv._wh[0]+', this.apDiv._wh[1]='+this.apDiv._wh[1]);

    ISPACES.ui.unsetWH0(this.leftDiv);
    ISPACES.ui.unsetWH0(this.rightDiv);
    ISPACES.ui.unsetH0(this.leftFileDiv);
    ISPACES.ui.unsetH0(this.rightFileDiv);

    //ISPACES.log.alert(this.id+'.snapTopLeft(): this.apDiv.bo(Constants.Borders.BOYE)');
    //this.apDiv.bo(Constants.Borders.BOYE);

    //ISPACES.log.alert(this.id+'.snapTopLeft(): this.apDiv.wiphip(100)');
    this.apDiv.wiphip(100);

    //ISPACES.log.alert(this.id+'.snapTopLeft(): this.divMain.wiphip(100)');
    this.divMain.wiphip(100);

    //this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
  }

  ,calculateHeight:function(){
    ISPACES.log.debug(this.id+'.calculateHeight()');

    var h=viewableWH[1];
    h-=this.resizableWindow.titlebar.wh[1]; // Subtract the titlebar.
    if(this.bottomMenu)h-=this.bottomMenu.wh[1]; // Subtract the bottom menu.
    //if(this.tabMenu)h-=this.tabMenu._wh[1]; // Subtract the tab menu.
    //h-=3; // Back the bottom off a little???
    //ISPACES.log.alert(this.id+'.calculateHeight(): h='+h);

    return {w:viewableWH[0],h:h};
  }
*/

  /*
  ,destroySave:function(e){
    ISPACES.log.debug(this.id+'.destroySave('+e+')');
    this.resizableWindow.hid(); // First off hide the window. Calls ResizableWindow.windowDiv.hid().
    //if(e)Common.stopEvent(e);
    AsyncApply.exec(new ISPACES.AsyncApply(this,"destroy",null,50));
  }

  ,destroy:function(){
    ISPACES.log.debug(this.id+'.destroy()');

    this.removeKeyListeners();    // Remove any event handlers from this app.
    //this.blur();
    this.resizableWindow.destroyWindow();
    ISPACES.spaces.space.removeAp(this);
    ISPACES.spaces.space.store.remove(this.id);

    for(var p in this){
      this[p]=null;
      delete this[p];
    }
  }

  ,xyz:function(x,y,z){
    ISPACES.log.debug(this.id+'.xyz('+x+','+y+','+z+')');
    this.resizableWindow.windowDiv.xyz(x,y,z);
  }
  */

  /**
   * Modal Windows
   * Copy, Move, Delete, New Folder
   */
  ,colorGreyout:'#0054F5' // #333, #000B80, #A6C6F6, #000
  //,colorGreyout:'#fff'
  ,opacityGreyout:'0.5'
  ,createGreyout:function(){
    //ISPACES.log.debug(this.id+'.createGreyout()');

    //var div=this.create.tagClass(Constants.Tags.DIV,'greyout');
    //var div=this.create.tag(Constants.Tags.DIV);
    var div=this.create.div();
    div.op(this.opacityGreyout,this.colorGreyout);
    /*
    div.hide();
    div.rel(0,-(this.divMain._wh[1]));
    div.hi(this.divMain._wh[1]);
    */
    //div.oc(function(){this.hide()});

    div.addListener(
      this.constants.CLICK
      ,function(){this.hide()}
    );

    div.escape=function(){this.hide()};
    /*
    ISPACES.log.alert(this.id+'.createGreyout(): this.apDiv.add(div)');
    this.apDiv.add(div); // Add the greyout layer.
    //this.apDiv.ow(Constants.Properties.HIDDEN);
    //this.divMain.hi(this.divMain._wh[1]);
    ISPACES.log.alert(this.id+'.createGreyout(): this.apDiv.hi('+this.apDiv._wh[1]+')');
    this.apDiv.hi(this.apDiv._wh[1]);
    ISPACES.ui.unsetWH(this.apDiv); // After we reset the height of the addDiv, we unset it again so that it does not upset any resizing.
    */
    return div;
  }

  /*
  ,createCenteringTable:function(){
    //ISPACES.log.alert(this.id+'.createCenteringTable()');

    var _this=this;
    var table=Common.Create.table(); // Table for centering the modal diaISPACES.log.
    //table.bo(Constants.Borders.BLACK);
    table.bo(Constants.Characters.ZERO);
    table.wip(100);
    var td=this.create.tag(Constants.Tags.TD);
    td.oc(function(e){_this.hideModal();Common.stopEvent(e);Common.stopDefaultEvent(e)});
    td.alCM();
    td.wip(100);
    td.hi(this.apDiv._wh[1]);
    var tr=Common.Create.tR(td);
    table.add(tr);
    table.td=td;
    tr.add(td);

    return table;
  }
  */

  /*
  ,resetDimensions:function(){
    ISPACES.log.alert(this.id+'.resetDimensions()');

    this.apDiv._wh=Common.getWH(this.apDiv);
    this.divMain._wh=Common.getWH(this.divMain);
    //ISPACES.log.alert(this.id+'.resetDimensions(): this.apDiv._wh[0] = '+this.apDiv._wh[0]+', this.apDiv._wh[1] = '+this.apDiv._wh[1]);
    //ISPACES.log.alert(this.id+'.resetDimensions(): this.divMain._wh[0] = '+this.divMain._wh[0]+', this.divMain._wh[1] = '+this.divMain._wh[1]);

    this.resetGreyout(); // Reset the greyout size position after a resize.
    this.resetCenteringTable(); // Reset the greyout size position after a resize.
  }
  */

  ,resetGreyout:function(){
    //ISPACES.log.debug(this.id+'.resetGreyout()');
    this.greyout.hide();
    this.greyout.rel(0,-(this.apDiv._wh[1]));
    this.greyout.hi(this.apDiv._wh[1]);
    //this.apDiv.hi(this.apDiv._wh[1]);
    //ISPACES.ui.unsetWH(this.apDiv); // After we reset the height of the addDiv, we unset it again so that it does not upset any resizing.
  }

  ,resetCenteringTable:function(){
    //ISPACES.log.debug(this.id+'.resetCenteringTable()');
    this.centeringTable.hide();
    this.centeringTable.rel(0,-(this.apDiv._wh[1]*2));
    this.centeringTable.td.hi(this.apDiv._wh[1]);

    /*
    //ISPACES.ui.unsetWH(this.centeringTable);
    ISPACES.ui.unsetH(this.centeringTable); // After resetting the centering table height, we unset the height to allow for resizing.
    //ISPACES.ui.unsetH(this.centeringTable.td); // After resetting the centering table height, we unset the height to allow for resizing.

    //this.apDiv.hi(this.apDiv._wh[1]);
    //ISPACES.ui.unsetWH(this.apDiv); // After we reset the height of the addDiv, we unset it again so that it does not upset any resizing.
    */
  }

  ,resetPositions:function(){
    ISPACES.log.debug(this.id+'.resetPositions()');

    this.resetPanelPositions();
    this.resetFolderPositions(); // for dnd
  }

  ,resetPanelPositions:function(){
    ISPACES.log.debug(this.id+'.resetPanelPositions()');

    this.panelCells.forEach(function(panelCell){
      panelCell._xy=Common.getXY(panelCell);
      panelCell._wh=Common.getWH(panelCell);
      //ISPACES.log.debug('panelCell._xy = '+panelCell._xy);
      //ISPACES.log.debug('panelCell._wh = '+panelCell._wh);
    });
  }

  ,resetFolderPositions:function(){
    ISPACES.log.debug(this.id+'.resetFolderPositions()');

    //ISPACES.log.debug('this.dropFolders.length = '+this.dropFolders.length);

    this.dropFolders.forEach(function(folder){
      folder._xy=Common.getXY(folder);
      folder._wh=Common.getWH(folder);
      //ISPACES.log.debug('folder._xy = '+folder._xy);
      //ISPACES.log.debug('folder._wh = '+folder._wh);
    });
  }

  ,ok:function(){
    ISPACES.log.debug(this.id+'.ok()');
    //this.modalCenteringTable.hide();
    /*
    this.modal.hide();
    this.modal.on=false;
    this.greyout.hide();
    */
    this.hideModal();
  }

  ,recreateRootsAndSelectFirstLocal:function(){
    ISPACES.log.debug(this.id+'.recreateRootsAndSelectFirstLocal()');

    this.cancel();

    this.recreateRoots();
    this.selectFirstLocal()
  }

  /*
   * //@see Roots.getTotalUsage(protocol)
   * @see Roots.setLocalRoots(json,apId)
   */
  ,recreateRoots:function(){
    ISPACES.log.debug(this.id+'.recreateRoots()');

    var panelCell
    ,rootUl
    ,rootsCell
    ,topbarDiv
    ,selectedLi
    ,i
    ,panelCells=this.panelCells
    ,z=panelCells.length
    //,rootParent
    //,topbar
    //,selectedProtocol
    ;

    //ISPACES.log.debug('panelCells.length = '+panelCells.length);

    for(i=0;i<z;i++){

      panelCell=panelCells[i]
      ,rootsCell=panelCell.rootsCell
      ,rootUl=panelCell.rootUl
      ,topbarDiv=panelCell.topbarDiv
      ;

      //ISPACES.log.debug('rootUl = '+rootUl);

      if(rootUl){

        //ISPACES.log.debug('rootUl.li = '+rootUl.li);

        var o={
          topbarDiv:topbarDiv
          //,selectedLi:selectedLi
        };

        selectedLi=rootUl.li; // grab the selected list item, so we can reselect it after recreating the root select.

        if(selectedLi){

          //ISPACES.log.debug(this.id+'.recreateRoots(): rootUl.li.protocol = '+rootUl.li.protocol);
          //ISPACES.log.debug(this.id+'.recreateRoots(): selectedLi = '+selectedLi);
          //ISPACES.log.debug(this.id+'.recreateRoots(): selectedLi.protocol = '+selectedLi.protocol);

          o.selectedLi=selectedLi;
        }

        /*
         * The first time a root is created, it should show the "Select" option.
         * If there is no previously selected list item and this is not the active panel, then firstTime should be true.
         */
        //if(!selectedLi)o.firstTime=true; // The first time the root is created, it should default to 'Select'.
        //o.firstTime=false;
        if(
          !selectedLi
          //&&panel!=this.panel
          &&panelCell!=this.panelCell
        ){
          o.firstTime=true; // The first time the root is created, it should default to 'Select'.
        }else{
          o.firstTime=false;
        }

        /*
         * Create the new root unordered list
         */
        var rootUlNew=this.createRootUl(o);


        /*
         * Add the new root listing to the parent, replacing the previous root lsiting.
         */
        //rootUl.parentNode.replace(rootUlNew,rootUl);
        /*
        rootParent=rootUl.parentNode;
        ISPACES.log.debug(this.id+'.recreateRoots(): rootParent = '+rootParent);
        if(rootParent){
          rootParent.replace(rootUlNew,rootUl);
        }
        panelCell.rootUl=rootUlNew;
        */
        //ISPACES.log.debug(this.id+'.recreateRoots(): rootsCell:'+rootsCell+'.replaceFirst(rootUlNew:'+rootUlNew+')');
        rootsCell.replaceFirst(rootUlNew);
        panelCell.rootUl=rootUlNew;

        //rootUl.li=; // grab the selected list item, so we can reselect it after recreating the root select.
        //selectedLi=selectedLi

/*
      rootParent=rootUl.parentNode;
      topbar=topbarDiv.topbar;
      selectedLi=rootUl.li; // grab the selected list item, so we can reselect it after recreating the root select.

      ISPACES.log.debug(this.id+'.recreateRoots(): panelCell.i = '+panelCell.i);
      ISPACES.log.alert(this.id+'.recreateRoots(): panelCell.i = '+panelCell.i);
      ISPACES.log.debug(this.id+'.recreateRoots(): panelCell.protocol = '+panelCell.protocol);
      ISPACES.log.alert(this.id+'.recreateRoots(): panelCell.protocol = '+panelCell.protocol);

      ISPACES.log.debug('panelCell = '+panelCell);
      ISPACES.log.debug('    rootUl = '+rootUl);
      ISPACES.log.debug('    rootParent = '+rootParent);
      ISPACES.log.debug('    topbarDiv = '+topbarDiv);
      ISPACES.log.debug('    topbar = '+topbar);
      ISPACES.log.debug('    selectedLi = '+selectedLi);

      var o={
        topbarDiv:topbarDiv
        ,selectedLi:selectedLi
      };

      var rootUlNew=this.createRootUl(o);
      panelCell.rootUl=rootUlNew; // Set a reference to the rootUl on the panelCell. @see divTable.ocButton().
      rootUlNew.mdmu(function(e){Common.stopEvent(e)}); // prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler
      panelCell.rootUl=rootUlNew; // Set a reference to the rootUl on the panelCell. @see divTable.ocButton().

      ISPACES.log.debug('rootUlNew.gCN() = '+rootUlNew.gCN());

      rootParent.replace(rootUlNew,rootUl);
      //rootParent.replaceFirst(rootUlNew,rootUl);
*/

      } // if(rootUl)
    }

  }

  ,selectFirstLocal:function(){
    ISPACES.log.debug(this.id+'.selectFirstLocal()');
    //ISPACES.log.alert(this.id+'.selectFirstLocal()');

    var panelCell=this.panelCell
    ,rootUl=panelCell.rootUl
    ;

    //ISPACES.log.debug('panelCell = '+panelCell);
    //ISPACES.log.debug('rootUl = '+rootUl);

    var firstLocalLi=this.getFirstLocalLi(rootUl);
    //ISPACES.log.debug('firstLocalLi = '+firstLocalLi);
    rootUl.isOpen=true;
    this.clickRoot(firstLocalLi);
  }

  ,getFirstLocalLi:function(ul){
    ISPACES.log.debug(this.id+'.getFirstLocalLi(ul:'+ul+')');

    var li
      ,lis=ul.lis
      ,z=lis.length
    ;

    //ISPACES.log.debug('lis.length = '+lis.length);

    for(var i=0;i<z;i++){
      li=lis[i];
      //ISPACES.log.debug('li.protocol = '+li.protocol+', li.isLocal = '+li.isLocal);
      if(li.isLocal)return li;
    }

    //var li=lis.some(function(li){if(li.isLocal)return li});
    //return li;
    //return lis.some(function(li){if(li.isLocal)return li}); // Experimenting with Array.some()
  }

  ,selectFirstLocalLi:function(ul){
    ISPACES.log.debug(this.id+'.getFirstLocalLi('+ul+')');

    var childNodes=ul.childNodes;
    //ISPACES.log.debug('childNodes = '+childNodes);
    //ISPACES.log.debug('childNodes.length = '+childNodes.length);

    var li,lis=ul.lis,z=lis.length;
    //ISPACES.log.debug('lis.length = '+lis.length);

    var panelCell=this.panelCell;

    for(var i=0;i<z;i++){
      li=lis[i];
      //ISPACES.log.debug('li.protocol = '+li.protocol+', li.isLocal = '+li.isLocal);

      if(li.isLocal){

        //ISPACES.log.debug('li.setClass(\'selected\')');
        li.setClass('selected');

        this.tree({
          panelCell:panelCell
          ,fileDiv:panelCell.fileDiv
          ,protocol:li.protocol
          ,isLocal:true
          //,refresh:true
        });

      }else{

        //ISPACES.log.debug('li.setClass('+this.constants.EMPTY+')');
        li.setClass(this.constants.EMPTY);

      }
    }
  }

  ,getParentNameAndPath:function(path){
    //ISPACES.log.debug(this.id+'.getParentNameAndPath("'+path+'")');
    if(path.endsWithChar(this.constants.FSLASH))path=path.substr(0,path.length-1);
    var lastIndexOfFileSeparator=path.lastIndexOf(this.constants.FSLASH);
    if(lastIndexOfFileSeparator==-1)return [this.constants.EMPTY,this.constants.EMPTY]; // We are at the root.
    return [path.substr(lastIndexOfFileSeparator+1),path.substr(0,lastIndexOfFileSeparator)];
  }

  ,getFileUrl:function(protocol,path,fileName){
    //ISPACES.log.debug(this.id+'.getFileUrl(protocol:"'+protocol+'", path:"'+path+'", fileName:"'+fileName+'")');

    /*
    var sb=new ISPACES.StringBuilder([
      protocol
    //  //,':/'
      ,':'
      ,path
    ]);
    */

    var sb=new ISPACES.StringBuilder();
    if(protocol)sb.appendAll([protocol,':']); // The UNIX root does not haev a protocol "/".
    sb.append(path);

    if(
      path!=this.constants.EMPTY
      &&!path.endsWithChar(this.constants.FSLASH)
    ){
      sb.append(this.constants.FSLASH);
    }

    if(fileName)sb.append(fileName);

    //ISPACES.log.debug('sb.asString() = "'+sb.asString()+'"');
    return sb.asString();
  }


  /*
   * Drag & Drop
   *
   * Drag
   */

  /*
   * Check if the drag is over this app first.
   * Then check the folders, then panelCells.
   */
  ,drag:function(
    x
    ,y
    ,draggable
  ){
    //ISPACES.log.debug(this.id+'.drag('+x+', '+y+', draggable:'+draggable+')');

    var windowDiv=this.windowDiv
    ,windowXY=windowDiv._xy
    ,windowWH=windowDiv._wh
    ;

    if(!windowXY)windowXY=windowDiv._xy=Common.getXY(windowDiv);
    if(!windowWH)windowWH=windowDiv._wh=Common.getWH(windowDiv);

    var windowX=windowXY[0]
    ,windowY=windowXY[1]
    ,windowW=windowWH[0]
    ,windowH=windowWH[1]
    ;

    //ISPACES.log.debug('windowXY = '+windowXY);
    //ISPACES.log.debug('windowWH = '+windowWH);

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

      // check folders
      if(this.dropFolders.some(this.checkDragFolders.bind(this,x,y,draggable)))return true; // if handled return true

      // check panelCells
      if(this.panelCells.some(this.checkDragPanels.bind(this,x,y,draggable)))return true; // handled?

      return true; // handled!

    }else if(this.isOver){
      this.isOver=false;
    }

    return false; // not handled!
  }

  ,checkDragFolders:function(
    x
    ,y
    ,draggable
    ,folder
  ){
    //ISPACES.log.debug(this.id+'.checkDragFolders(x:'+x+', y:'+y+', draggable:'+draggable+', folder:'+folder+')');

    /*
     * Get the panel from the XY coordinates. There may be a better way of doing this by getting the panel from the drop folder.
     */
    //*
    var panelCell
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ,i
    ;

    for(i=0;i<z;i++){

      panelCell=panelCells[i];

      var panelXY=panelCell._xy
      ,panelWH=panelCell._wh
      ;

      if(!panelXY)panelXY=panelCell._xy=Common.getXY(panelCell);
      if(!panelWH)panelWH=panelCell._wh=Common.getWH(panelCell);

      //ISPACES.log.debug('panelXY = '+panelXY);
      //ISPACES.log.debug('panelWH = '+panelWH);

      if(
        (x>panelXY[0])
        &&(x<(panelXY[0]+panelWH[0]))
        &&(y>panelXY[1])
        &&(y<(panelXY[1]+panelWH[1]))
      ){
        //ISPACES.log.debug(this.id+'.checkDragFolders(x:'+x+', y:'+y+', folder:'+folder+'): break; '+panelCell.url);
        break; // break when the xy is inside a panelCell
      }
    }
    //*/

    var folderXY=folder._xy;
    var folderWH=folder._wh;

    if(!folderXY)folderXY=folder._xy=Common.getXY(folder);
    if(!folderWH)folderWH=folder._wh=Common.getWH(folder);

    //ISPACES.log.debug('folderXY = '+folderXY);
    //ISPACES.log.debug('folderWH = '+folderWH);

    if(
      (x>folderXY[0])
      &&(x<(folderXY[0]+folderWH[0]))
      &&(y>folderXY[1])
      &&(y<(folderXY[1]+folderWH[1]))
    ){

      if(!folder.isOver){

        folder.isOver=true;

        this.enterFolder(
          folder
          ,draggable
          ,panelCell
        );

      }

      return true;

    }else if(folder.isOver){

      folder.isOver=false;
      this.leaveFolder(folder,draggable);

    }

    return false;
  }

  ,checkDragPanels:function(
    x,y
    ,draggable
    ,panelCell
  ){
    //ISPACES.log.debug(this.id+'.checkDragPanels(x:'+x+', y:'+y+', draggable:'+draggable+', panelCell:'+panelCell+')');

    var panelXY=panelCell._xy
    ,panelWH=panelCell._wh
    ;

    if(!panelXY)panelXY=panelCell._xy=Common.getXY(panelCell);
    if(!panelWH)panelWH=panelCell._wh=Common.getWH(panelCell);

    //ISPACES.log.debug('panelXY = '+panelXY);
    //ISPACES.log.debug('panelWH = '+panelWH);

    if(
      (x>panelXY[0])
      &&(x<(panelXY[0]+panelWH[0]))
      &&(y>panelXY[1])
      &&(y<(panelXY[1]+panelWH[1]))
    ){

      if(!panelCell.isOver){
        panelCell.isOver=true;
        this.enterPanel(panelCell,draggable);
      }

      return true;

    }else if(panelCell.isOver){

      panelCell.isOver=false;
      this.leavePanel(panelCell,draggable);

    }

    return false;
  }

  ,mouseEnter:function(draggable){
    ISPACES.log.debug(this.id+'.mouseEnter(draggable:'+draggable+')');

    draggable.rowBottom.hide();
    draggable.isOverDesktop=false;
  }

  ,enterPanel:function(
    panelCell
    ,draggable
  ){
    ISPACES.log.debug(this.id+'.enterPanel(panelCell:'+panelCell+', draggable:'+draggable+')');

    var protocol=panelCell.protocol;
    if(protocol){

      draggable.setFileName(new ISPACES.StringBuilder([
        protocol
        ,':/'
      ]).asString());

      draggable.rowBottom.show();
    }
    //panelCell.isOver=true;
  }

  ,leavePanel:function(
    panelCell
    ,draggable
  ){
    ISPACES.log.debug(this.id+'.leavePanel(panelCell.id:'+panelCell.id+', draggable:'+draggable+')');

    draggable.rowBottom.hide();
    //panelCell.isOver=false;
    draggable.isOverDesktop=false;
  }

  ,enterFolder:function(
    folder
    ,draggable
    ,panelCell
  ){
    ISPACES.log.debug(this.id+'.enterFolder(folder:'+folder+', draggable:'+draggable+', panelCell:'+panelCell+')');

    //ISPACES.log.debug('draggable.isLocal = '+draggable.isLocal);
    //ISPACES.log.debug('draggable.protocol = '+draggable.protocol);
    //ISPACES.log.debug('panelCell.isLocal = '+panelCell.isLocal);
    //ISPACES.log.debug('folder.isLocal = '+folder.isLocal);
    //ISPACES.log.debug('folder.url = "'+folder.url+'"');
    //ISPACES.log.debug('folder.protocol = '+folder.protocol);

    var li=folder.li
    ,folderName=li.fileName
    ,targetProtocol=li.protocol
    ;

    //ISPACES.log.debug('li = '+li);
    //ISPACES.log.debug('li.isLocal = '+li.isLocal);
    //ISPACES.log.debug('li.protocol = '+li.protocol);
    //ISPACES.log.debug('li.fileName = '+li.fileName);
    //ISPACES.log.debug('folderName = "'+folderName+'"');
    //ISPACES.log.debug('targetProtocol = "'+targetProtocol+'"');

    li.on=true;
    this.li=li;
    panelCell.li=li; // select the li by setting a reference  on the panelCell.
    panelCell.isOver=false; // reset the isOver flag on the panelCell as we are now over a folder.
    folder.setClass('dragged');

    var url=draggable.url
    ,fileName=draggable.fileName
    ,panelCell=draggable.panelCell
    ,sourceProtocol
    ,mouseDownElement=draggable.mouseDownElement
    ;

    //ISPACES.log.debug('mouseDownElement.protocol = '+mouseDownElement.protocol);

    if(panelCell){
      //ISPACES.log.debug('panelCell = '+panelCell);
      //ISPACES.log.debug('panelCell.protocol = '+panelCell.protocol);
      sourceProtocol=panelCell.protocol;
    }else if(mouseDownElement){
      sourceProtocol=mouseDownElement.protocol;
    }

    //ISPACES.log.debug('fileName = "'+fileName+'"');
    //ISPACES.log.debug('targetProtocol = '+targetProtocol);
    //ISPACES.log.debug('sourceProtocol = '+sourceProtocol);

    if(targetProtocol!=sourceProtocol){
      draggable.divTop.replaceFirst(this.create.txt(ISPACES.getString('Copy')));
    }else{
      draggable.divTop.replaceFirst(this.create.txt(ISPACES.getString('Copy/Move')));
    }


    draggable.setFileName(folderName);
    //draggable.setUrl(url);
    draggable.rowBottom.show();
    draggable.isOverDesktop=false;

    //var mouseDownElement=draggable.mouseDownElement; // the element where the mousedown occurred
    //var url=draggable.url;
    //var fileName=draggable.fileName;
    //var li=draggable.li;

    //ISPACES.log.debug('mouseDownElement = '+mouseDownElement);
    //ISPACES.log.debug('url = '+url);
    //ISPACES.log.debug('fileName = '+fileName);
    //ISPACES.log.debug('li = '+li);

    //ISPACES.log.debug('folder.openFolderCall = '+folder.openFolderCall);
    if(!folder.openFolderCall){
      //ISPACES.log.debug('folder.openFolderCall=new ISPACES.AsyncApply()');
      folder.openFolderCall=new ISPACES.AsyncApply(
        this
        ,"toggleOpenFolder"
        ,[li]
        ,1000
      );
    }
  }

  ,leaveFolder:function(
    target
    ,draggable
  ){
    ISPACES.log.debug(this.id+'.leaveFolder(target.url:'+target.url+', draggable:'+draggable+')');

    //target.isOver=false;

    target.setClass('');
    //target.style.outline='';

    /*
    var draggableTarget=this.draggableTarget;
    //ISPACES.log.debug('draggableTarget = '+draggableTarget);
    //if(!draggableTarget)draggableTarget=this.draggableTarget=this.create.draggableTarget(); // If the draggable target has not been created before, create it.

    //draggableTarget.bottomDiv.hide();
    draggableTarget.rowBottom.hide();
    */
    draggable.rowBottom.hide();

    if(target.openFolderCall){
      target.openFolderCall.cancel();
      target.openFolderCall=null;
    }
  }


  /*
   * Drag & Drop
   *
   * Drop
   */

  /*
   * Catch-all mouseUp function for the FileManager.
   * Checks for the presence of the global draggable. i.e. ISPACES.global.draggable
   * Resets the global draggable to null for the next drag. Only if the mouseUp() was handled. Otherwise the global draggable passes to the next handler.
   * @return true if this function was able to process the mouse up event.
   */
  ,mouseUp:function(
    e
    ,draggable
  ){
    ISPACES.log.debug(this.id+'.mouseUp(e:'+e+', draggable:'+draggable+')');

    var _this=this;

    if(this.dragPanelFunction){
      ISPACES.log.debug('typeof this.dragPanelFunction = '+typeof this.dragPanelFunction);
      //removeListener(document,MOUSEMOVE,this.dragPanelFunction,false);
      //this.dragPanelFunction=null;
      this.dragCell.mouseUp(e);
    }

    if(this.resizePanelFunction){
      ISPACES.log.debug('typeof this.resizePanelFunction = '+typeof this.resizePanelFunction);
      Common.removeListener(
        document
        ,Constants.Events.MOUSEMOVE
        ,this.resizePanelFunction
        ,false
      );
      this.resizePanelFunction=null;
    }

    if(this.mouseMoveFunction){
      ISPACES.log.debug('typeof this.mouseMoveFunction = '+typeof this.mouseMoveFunction);

      this.li.div.mouseUp(e);

      Common.removeListener(
        document
        ,Constants.Events.MOUSEMOVE
        ,this.mouseMoveFunction
        ,false
      );

      this.mouseMoveFunction=null;

      /*
       * The mouseUp() function gets called twice.
       * Once from Space.mouseUpCapturing() and once from the ISPACES.global.draggableObject being caught in the global catch-all Common.mouseUp() function.
       * Do we need to nullify the global draggable object here?
       */
      //ISPACES.global.draggableObject=null;
    }

    //var dropTarget=ISPACES.dropObject;
    //var draggable=this.draggable||ISPACES.draggable; // The drag element can either be attached locally or on the global ISPACES draggable.
    //var draggable=ISPACES.draggable; // The drag element can either be attached locally or on the global ISPACES draggable.
    //var draggable=ISPACES.global.draggable; // The drag element can either be attached locally or on the global ISPACES draggable.

    if(draggable){

      //ISPACES.log.debug('draggable.url = '+draggable.url);
      //ISPACES.log.debug('draggable.fileName = '+draggable.fileName);

      /*
      ISPACES.log.debug(this.id+'.mouseUp('+e+'): ISPACES.global.mouseUpObject = '+ISPACES.global.mouseUpObject);
      ISPACES.log.debug(this.id+'.mouseUp('+e+'): ISPACES.global.mouseUpObject=null;');
      ISPACES.global.mouseUpObject=null; // Reset the global mouseUp object to null, for the next drag.
      */

      /*
      var mouseXY=Common.getMouseXY(e)
      ,x=mouseXY[0]
      ,y=mouseXY[1]
      ;
      //ISPACES.log.debug('mouseXY = '+mouseXY);
      */

      /*
       * Get the panelCell from the XY coordinates of the mouseup.
       * Temporary. There may be a better way of doing this by getting the panelCell from the drop folder.
       */
      //*
      var panelCell
      ,panelCells=this.panelCells
      ,x=e.pageX
      ,y=e.pageY
      ,z=panelCells.length
      ,i
      ;

      for(i=0;i<z;i++){

        panelCell=panelCells[i]
        ,panelXY=panelCell._xy
        ,panelWH=panelCell._wh
        ;

        if(!panelXY)panelXY=panelCell._xy=Common.getXY(panelCell);
        if(!panelWH)panelWH=panelCell._wh=Common.getWH(panelCell);

        //ISPACES.log.debug('panelXY = '+panelXY);
        //ISPACES.log.debug('panelWH = '+panelWH);

        var panelX=panelXY[0]
        ,panelY=panelXY[1]
        ,panelW=panelWH[0]
        ,panelH=panelWH[1]
        ;

        /*
        if(
          (x>panelXY[0])
          &&(x<(panelXY[0]+panelWH[0]))
          &&(y>panelXY[1])
          &&(y<(panelXY[1]+panelWH[1]))
        ){
        */
        if(
          (x>panelX)
          &&(x<(panelX+panelW))
          &&(y>panelY)
          &&(y<(panelY+panelH))
        ){

          //ISPACES.log.debug(this.id+'.mouseUp('+e+'): panelCell.id='+panelCell.id+', panelCell.i='+panelCell.i+', panelCell.url='+panelCell.url);
          ISPACES.log.info('draggable was dropped over panel '+panelCell.id);
          break;

        }
      }
      //*/

      //*
      //ISPACES.log.debug('this.dropFolders.length = '+this.dropFolders.length);
      var dropFolders=this.dropFolders;

      if(dropFolders.length>0){ // Drag & Drop

        var folder
        ,folderXY
        ,folderX
        ,folderY
        ,folderWH
        ,folderW
        ,folderH
        ,z=dropFolders.length
        ,i
        ;

        for(i=0;i<z;i++){

          folder=dropFolders[i];

          folderXY=Common.getXY(folder)
          ,folderX=folderXY[0]
          ,folderY=folderXY[1]
          ;

          folderWH=Common.getWH(folder)
          ,folderW=folderWH[0]
          ,folderH=folderWH[1]
          ;

          if(
            (x>folderX)
            &&(x<(folderX+folderW))
            &&(y>folderY)
            &&(y<(folderY+folderH))
          ){
            ISPACES.log.debug('draggable was dropped onto folder '+folder+', url='+folder.url);
            //ISPACES.log.debug('draggable.url = '+draggable.url+', folder.url='+folder.url);

            this.dropFolder(
              draggable
              ,panelCell
              ,folder
            );

            //ISPACES.draggable=null; // Reset the draggable to null after retrieving it... for the next drag. Only if the mouseUp() was handled.
            //e.handled=true; // Set a custom flag on this event object, telling other event listeners that the event has been handled.
            //break;
            return true;
          }
        }
      } // if(dropFolders.length>0){ // Drag & Drop
      //*/

      //ISPACES.log.debug('this.dropPanels.length = '+this.dropPanels.length);

      /*
       * dropPanels is an array of panelCells.
       */
      var dropPanels=this.dropPanels;

      if(dropPanels.length>0){ // Drag & Drop

        var mouseXY=Common.getMouseXY(e);
        //ISPACES.log.debug('mouseXY = '+mouseXY);

        for(var i=0;i<dropPanels.length;i++){

          var panel=dropPanels[i];
          if(panel){

            var panelXY=Common.getXY(panel);
            var panelWH=Common.getWH(panel);
            //var panelWidth=parseInt(panel.offsetWidth);
            //var panelHeight=parseInt(panel.offsetHeight);

            //ISPACES.log.debug('panelXY = '+panelXY);
            //ISPACES.log.debug('panelWH = '+panelWH);
            //ISPACES.log.debug('mouseUp(e): panelWidth = '+panelWidth+', panelHeight = '+panelHeight);

            if(
              (mouseXY[0]>panelXY[0])
              &&(mouseXY[0]<(panelXY[0]+panelWH[0]))
              &&(mouseXY[1]>panelXY[1])
              &&(mouseXY[1]<(panelXY[1]+panelWH[1]))
            ){
              ISPACES.log.debug('draggable was dropped onto panel '+panel+', id = '+panel.id);

              //ISPACES.dropObject=null;
              //_this.draggable=null;

              /*
              // For some reason we are getting a double hit on panels. TBD.
              //AsyncApply.exec(panel.call);
              //if(panel.apply)panel.apply.apply();
              //panel.dropFunction.apply(panel.app,[globalDraggable.app,panel.index]);
              panel.dropFunction.apply(panel.app,[globalDraggable,panel]);
              //panel.ap.dropFunction.apply(panel.ap,[globalDraggable,panel]);
              //ISPACES.spaces.moveApp(globalDraggable.ap,panel.index); // If we only want to drop the app without switching.
              //ISPACES.spaces.switchSpace(ap,panel.index); // If we want to switch the space after dropping the app.
              //*/

              //_this.copy();
              //this.copy.bind(this);
              //this.copy();
              //this.copy(true);
              //this.copy(draggable.url,true);
              //this.drop(panel,draggable.url);
              //this.drop(panel,draggable);
              this.drop(
                draggable
                ,panel
              );

              //ISPACES.log.debug(this.id+'.mouseUp('+e+'): ISPACES.global.draggable=null;');
              ISPACES.global.draggable=null; // Reset the draggable to null after retrieving it... for the next drag. Only if the mouseUp() was handled.

              e.handled=true; // Set a custom flag on this event object, telling other event listeners that the event has been handled.

              //break;
              return true;
            }
          }
        }
      }

      //ISPACES.draggable=null; // Reset the draggable to null after retrieving it... for the next drag.

    } // if(draggable)

    return false; // False - this mouseup event was not handles by this ap/function.
  }

  ,dropFolder:function(
    draggable
    ,panelCell
    ,folder
  ){
    ISPACES.log.debug(this.id+'.dropFolder(draggable:'+draggable+', panelCell:'+panelCell+', folder:'+folder+')');

    /*
     * When dragging a file over a folder, the folder opens automatically by setting an asynchronous call.
     * If the drop happens before the folder opens, cancel the call.
     * @see folder.openFolderCall=new ISPACES.AsyncApply()
     */
    //ISPACES.log.debug('folder.openFolderCall = '+folder.openFolderCall);
    if(folder.openFolderCall){
      //ISPACES.log.debug('folder.openFolderCall.cancel()');
      folder.openFolderCall.cancel();
      folder.openFolderCall=null;
      delete folder["openFolderCall"];
    }

    this.drop(
      draggable
      ,panelCell
      ,folder
    );
  }

  /*
   * Modals
   */

  ,drop:function(
    draggable // the draggable element
    ,panelCell      // the target panelCell
    ,folder    // the target folder being dropped on
  ){
    ISPACES.log.debug(this.id+'.drop(draggable:'+draggable+', panelCell:'+panelCell+', folder:'+folder+')');

    //ISPACES.log.debug('draggable.mouseDownElement = '+draggable.mouseDownElement);
    //ISPACES.log.debug('draggable.url = "'+draggable.url+'"');
    //ISPACES.log.debug('draggable.isDir = '+draggable.isDir);

    if(folder){ // a drop can be on a panel only, so a folder may not be available

      //ISPACES.log.debug('folder.url = "'+folder.url+'"');
      //ISPACES.log.debug('folder.isDir = '+folder.isDir);
      //ISPACES.log.debug('folder.li = '+folder.li);

      ISPACES.global.draggable.mouseUpElement=folder; // Set a reference to the folder on the global draggable, so the folder can be deselected after a drop. @see cancel()
    }

    var targetProtocol=panelCell.protocol;

    //ISPACES.log.debug('targetProtocol = "'+targetProtocol+'"');

    /*
     * from
     */
    var fromUrl=draggable.url
    ,lastIndexOfFslash=fromUrl.lastIndexOf(this.constants.FSLASH)
    ,fromFileName=fromUrl.substring(lastIndexOfFslash+1)
    ;

    /*
     * to
     * Create the toUrl. Create the target URL.
     * Check for some 'to' indication first so we can display an error modal if there is no 'to'.
     */
    var sb=new ISPACES.StringBuilder();

    if(!folder){ // if there is no file/folder selected

      //var targetProtocol=panelCell.protocol; // check for a panelCell selected
      //ISPACES.log.debug('targetProtocol = "'+targetProtocol+'"');

      if(!targetProtocol){

        this.error(ISPACES.getString('Please select a destination'));
        return;

      }else{

        sb.appendAll([
          targetProtocol
          ,':/'
        ]);

      }

    }else{

      var url=folder.url;
      var isDir=folder.isDir;

      //ISPACES.log.debug('url = "'+url+'"');
      //ISPACES.log.debug('isDir = '+isDir);

      if(isDir){
        sb.appendAll([
          url
          ,this.constants.FSLASH
        ]);
      }else{ // Get the parent directory name from the fileName
        var i=url.lastIndexOf(this.constants.FSLASH);
        sb.append(url.substring(0,i+1));
      }

    }
    sb.append(fromFileName);
    var toUrl=sb.asString();

    //ISPACES.log.debug('fromUrl = "'+fromUrl+'"');
    //ISPACES.log.debug('toUrl   = "'+toUrl+'"');

    var source=draggable.mouseDownElement
    ,sourceAp=draggable.ap
    ,sourcePanel=draggable.panelCell
    ,sourceLi=source.li
    ,sourceIsDir=source.isDir
    ,sourceIsLocal=source.isLocal
    ,sourceProtocol
    ;

    var url=draggable.url
    ,fileName=draggable.fileName
    //,panelCell=draggable.panelCell
    ,sourceProtocol
    ,mouseDownElement=draggable.mouseDownElement
    ;

    //ISPACES.log.debug('mouseDownElement.protocol = '+mouseDownElement.protocol);

    if(sourcePanel){

      //ISPACES.log.debug('sourcePanel = '+sourcePanel);
      //ISPACES.log.debug('sourcePanel.protocol = '+sourcePanel.protocol);
      sourceProtocol=sourcePanel.protocol;
      sourcePanel.isLocal=sourceIsLocal;

    }else if(mouseDownElement){
      sourceProtocol=mouseDownElement.protocol;
    }

    //ISPACES.log.debug('source = '+source);
    //ISPACES.log.debug('source.isDir = '+source.isDir);
    //ISPACES.log.debug('source.isLocal = '+source.isLocal);
    //ISPACES.log.debug('sourceAp = '+sourceAp);
    //ISPACES.log.debug('sourcePanel = '+sourcePanel);
    //ISPACES.log.debug('sourceLi = '+sourceLi);
    //ISPACES.log.debug('sourceIsDir = '+sourceIsDir);
    //ISPACES.log.debug('sourceIsLocal = '+sourceIsLocal);
    //ISPACES.log.debug('targetProtocol = '+targetProtocol);
    //ISPACES.log.debug('sourceProtocol = '+sourceProtocol);

    var isMove=(sourceProtocol==targetProtocol);
    //ISPACES.log.debug('isMove = '+isMove);

    /*
     * the modal, greyout layer, and centering layer
     */
    var modal=this.copyModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    /*
     * Cover the app and set the escape mechanism.
     * Covering the app creates the greyout layer.
     * We call resizableWindow.cover() before resizableWindow.addCenteringTable() so the z-index of the centering table can be greater than the greyout.
     */
    //resizableWindow.cover('0.6','#000');
    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){ // If the modal has not been created before, create it.
      //modal=this.copyModal=this.createCopyModal(true);
      //modal=this.copyModal=this.createCopyModal(isMove);
      modal=this.copyModal=this.createCopyModal();
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    /*
     * Set some references on the modal. @see okCopy()
     */
    if(sourceLi){
      //ISPACES.log.debug('sourceLi.protocol = '+sourceLi.protocol);
      //ISPACES.log.debug('sourceLi.url = '+sourceLi.url);

      //sourceIsDir=sourceLi.isDir;
      //ISPACES.log.debug('sourceIsDir = '+sourceIsDir);

      // Deselect the source file?
      //this.deselectLi(sourceLi);

      modal.sourceLi=sourceLi; // @see okCopy()
    }

    if(sourcePanel){
      //ISPACES.log.debug('sourcePanel.protocol = '+sourcePanel.protocol);
      modal.sourcePanel=sourcePanel; // Set a reference to the source panelCell. @see okCopy()
    }

    if(panelCell)modal.targetPanel=panelCell; // @see okCopy()

    //if(targetLi)modal.targetLi=targetLi; // @see okCopy()
    //if(folder)modal.targetLi=folder; // @see okCopy()
    if(folder){
      var targetLi=folder.li;
      //ISPACES.log.debug('targetLi = '+targetLi);
      modal.targetLi=targetLi; // @see okCopy()
      //modal.targetLi=folder.li; // @see okCopy()
    }

    if(isMove){
      modal.rowButtonMove.show();
    }else{
      modal.rowButtonMove.hide();
    }

    /*
     * from
     */
    var divFrom=modal.divFrom;
    var ext;
    var char;

    if(sourceIsDir){

      ext='folder';
      char='H';
      divFrom.sA('type','folder');

    }else{

      var lastIndexOfDot=fromFileName.lastIndexOf(Constants.Characters.DOT);
      //ISPACES.log.debug('lastIndexOfDot = '+lastIndexOfDot);

      if(lastIndexOfDot!=-1){
        ext=fromFileName.substring(lastIndexOfDot+1);
      }else{
        ext='default';
      }

      //ISPACES.log.debug('ext = "'+ext+'"');
      //char=ISPACES.MimeTypes.getChar(ext);
      //ISPACES.log.debug('char = "'+char+'"');
      if(!char)char='a';

      divFrom.sA('type','file');
    }

    divFrom.replaceFirst(Common.Create.txt(fromFileName));
    divFrom.sA('ext',ext);
    divFrom.sA('char',char);


    /*
     * to
     */
    var divTarget=modal.divTarget;
    //divTarget.sA('type','file');
    divTarget.sA('char',char);
    divTarget.sA('ext',ext);

    var a=toUrl.split(this.constants.COLON);
    var protocol=a[0];
    //ISPACES.log.debug('protocol = "'+protocol+'"');
    divTarget.sA('protocol',protocol);
    divTarget.replaceFirst(this.create.txt(toUrl));

    // Set a reference to the fromUrl and toUrl on the modal.
    modal.fromUrl=fromUrl;
    modal.toUrl=toUrl;

    /*
     * show the modal
     */
    modal.moveCell.show();
    modal.show();
    centeringTable.show();

    /*
     * Set the escape route. Set the escape function for the global escape catcher.
     */
    modal.on=true;
    this.modal=modal;

    /*
    var _this=this;
    modal.escape=function(){
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
      resizableWindow.uncover();
      _this.cancel();
    };
    ISPACES.global.escapeKeyObject=modal;
    ISPACES.global.escapeObject=modal;
    */
    /*
     * The global 'click' handler escapes the drop.
     * Moving this setModalEscape() function to an asynchronous call, so the drop() function can return, before setting the escape mechanism.
     */
    new ISPACES.AsyncApply(
      this
      ,"setModalEscape"
      ,[
        modal
        ,resizableWindow
      ]
      ,100
    );
  }

  ,setModalEscape:function(
    modal
    ,resizableWindow
  ){
    ISPACES.log.debug(this.id+'.setModalEscape(modal:'+modal+', resizableWindow:'+resizableWindow+')');

    //var modal=this.modal;
    //var resizableWindow=this.resizableWindow;
    if(!resizableWindow)resizableWindow=_this.resizableWindow;

    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
      //return false;
    };
    ISPACES.global.escapeKeyObject=modal;
    ISPACES.global.escapeObject=modal;
  }

  /*
   * Copy Modal
   */

  ,copy:function(e){
    ISPACES.log.debug(this.id+'.copy('+e+')');

    Common.killEvent(e); // We have to kill the event, otherwise it closes the modal

    var panelCell=this.panelCell
    ,panelLi
    ,isLocal
    ;

    if(panelCell){ // is there a panel selected
      panelLi=panelCell.li;
      isLocal=panelCell.isLocal;
      if(!panelLi){
        var toProtocol=panelCell.protocol; // check for a panel selected
        //ISPACES.log.debug('toProtocol = "'+toProtocol+'"');
        if(!toProtocol){
          this.error(ISPACES.getString('Please select a file or folder to copy'));
          return;
        }
      }
    }else{
      this.error(ISPACES.getString('Please select a file or folder to delete'));
      return;
    }


    var modal=this.copyModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    //ISPACES.log.debug('modal = '+modal);
    //ISPACES.log.debug('resizableWindow = '+resizableWindow);
    //ISPACES.log.debug('centeringTable = '+centeringTable);

    /*
     * Cover the app and set the escape mechanism.
     * Covering the app creates the greyout layer.
     * We call resizableWindow.cover() before resizableWindow.addCenteringTable() so the z-index of the centering table can be greater than the greyout.
     */
    //resizableWindow.cover('0.6','#000');
    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){ // If the modal has not been created before, create it.
      modal=this.copyModal=this.createCopyModal(true);
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
      //centeringTable.addModal(modal); // better more object oriented way - future work
    }

    // Set the escape route. Set the escape function for the global escape catcher.
    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
      return false;
    };
    ISPACES.global.escapeKeyObject=modal; // Allow the user to escape out of copy modal.
    ISPACES.global.escapeObject=modal; // Allow the user to escape out of copy modal.


    /*
     * from
     */
    var divFrom=modal.divFrom;
    var fromFileName;
    var fromUrl;
    var sourceIsDir;

    if(this.panelCell&&this.previousPanel){ // Make sure there are selected files/folders.

      /*
       * Get the from and To URLs.
       */
      var sourceLi=this.panelCell.li;
      var targetLi=this.previousPanel.li;

      if(sourceLi){
        fromUrl=sourceLi.url;
        fromFileName=sourceLi.fileName;
        sourceIsDir=sourceLi.isDir;
      }

    } // if(this.panelCell&&this.previousPanel)

    //ISPACES.log.debug('fromUrl = '+fromUrl);
    //ISPACES.log.debug('fromFileName = "'+fromFileName+'"');
    //ISPACES.log.debug('sourceIsDir = '+sourceIsDir);
    //ISPACES.log.debug('ISPACES.applications.getExt(fromUrl) = '+ISPACES.applications.getExt(fromUrl));
    //ISPACES.log.debug('ISPACES.applications.getExt(fromFileName) = '+ISPACES.applications.getExt(fromFileName));

    //var ext=ISPACES.applications.getExt(fromFileName);
    //var char=ISPACES.MimeTypes.getChar(ext);
    var ext;
    var char;

    if(sourceIsDir){

      ext='folder';
      char='H';
      divFrom.sA('type','folder');

    }else{

      var lastIndexOfDot=fromFileName.lastIndexOf(Constants.Characters.DOT);
      //ISPACES.log.debug('lastIndexOfDot = '+lastIndexOfDot);
      if(lastIndexOfDot!=-1){
        ext=fromFileName.substring(lastIndexOfDot+1);
      }else{
        ext='default';
      }
      //ISPACES.log.debug('ext = "'+ext+'"');
      char=ISPACES.MimeTypes.getChar(ext);
      //ISPACES.log.debug('char = "'+char+'"');
      if(!char)char='a';

      divFrom.sA('type','file');
    }

    //ISPACES.log.debug('ext = '+ext);
    //ISPACES.log.debug('char = '+char);

    divFrom.replaceFirst(this.create.txt(fromFileName));
    //divFrom.replaceFirst(Common.Create.txt(fromFileName));
    divFrom.sA('ext',ext);
    divFrom.sA('char',char);


    /*
     * to
     */
    var divTarget=modal.divTarget;

    var toUrl;
    var toIsDir;
    var targetLi=this.previousPanel.li;

    if(targetLi){
      toUrl=targetLi.url;
      toIsDir=targetLi.isDir;
    }

    //ISPACES.log.debug('toUrl = "'+toUrl+'"');
    //ISPACES.log.debug('toIsDir = '+toIsDir);

    var sb=new ISPACES.StringBuilder();

    if(toIsDir){

      sb.appendAll([
        toUrl
        ,'/'
        ,fromFileName
      ]);

    }else{ // Get the parent directory name from the fileName

      var lastIndexOfFslash=toUrl.lastIndexOf(this.constants.FSLASH);
      sb.appendAll([
        toUrl.substring(0,(lastIndexOfFslash+1))
        ,fromFileName
      ]);

    }

    toUrl=sb.asString();
    //ISPACES.log.debug('toUrl = "'+toUrl+'"');

    var a=toUrl.split(this.constants.COLON);
    var protocol=a[0];
    //ISPACES.log.debug('protocol = "'+protocol+'"');

    divTarget.replaceFirst(this.create.txt(toUrl));
    divTarget.sA('protocol',protocol);
    divTarget.sA('type','file');
    divTarget.sA('char',char);
    //divTarget.sA('ext',ext);

    // Set the URLs as properties to the modal. @see okCopy()
    //modal.setfromUrl(fromUrl);
    //modal.settoUrl(toUrl);
    modal.fromUrl=fromUrl;
    modal.toUrl=toUrl;

    modal.moveCell.hide();
    modal.show();
    centeringTable.show();

    modal.on=true;

    this.modal=modal;
  }

  ,createModal:function(){
    ISPACES.log.debug(this.id+'.createModal()');

    /*
    var closeCell=this.create.divCell(closeButton).setClass('closecell');
    var closeRow=this.create.divRow(closeCell).setClass('closerow');
    var closeTable=this.create.divTable(closeRow).setClass('closetable');
    var closeDiv=this.create.divTable(closeTable).setClass('closediv');

    //closeCell.ma('0'),closeCell.pa('0'),closeCell.hi(1);
    //closeRow.ma('0'),closeRow.pa('0'),closeRow.hi(1);
    //closeTable.ma('0'),closeTable.pa('0'),closeTable.hi(1);
    */

    var create=this.create
    ,closeButton=create.div(create.txt('u')).setClass('closebutton')
    ,closeCell=create.div(closeButton)
    ,closeRow=create.div(closeCell)
    ,closeTable=create.div(closeRow)
    ,closeDiv=create.div(closeTable)
    ;

    closeButton.addListener(
      this.constants.MOUSEDOWN
      ,this.clickCloseModal.bind(this)
    );

    return create.div(closeDiv).setClass('modal');
  }

  ,clickCloseModal:function(e){
    ISPACES.log.debug(this.id+'.clickCloseModal('+e+')');

    //this.hideModal();
    this.cancel();

    //Common.stopEvent(e);
    Common.killEvent(e);

    /*
     * Unset the global escape objects.
     */
    ISPACES.global.escapeKeyObject=null; // Unset the global escapeKeyObject
    ISPACES.global.escapeObject=null; // Unset the global escapeObject
  }

  ,cancel:function(){
    ISPACES.log.debug(this.id+'.cancel()');

    var draggable=ISPACES.global.draggable;

    if(draggable){

      var target=ISPACES.global.draggable.mouseUpElement;
      //ISPACES.log.debug('target = '+target);

      var source=ISPACES.global.draggable.mouseDownElement;
      //ISPACES.log.debug('source = '+source);

      if(target){
        var targetLi=target.li;
        ISPACES.log.debug('targetLi = '+targetLi);
        // Deselect the target file.
        this.deselectLi(targetLi);
      }

      if(source){
        var sourceLi=source.li;
        //ISPACES.log.debug('sourceLi = '+sourceLi);
        if(sourceLi){ // TBD - there is no sourceLi when a file is being dragged from the desktop.
          // Deselect the source file.
          this.deselectLi(sourceLi);
        }else{
          ISPACES.log.warn(this.id+'.cancel(): TBD - there is no sourceLi when a file is being dragged from the desktop.');
        }
      }
    }

    /*
    this.modal.hide();
    //this.modalCenteringTable.hide();
    this.greyout.hide();
    */
    //ISPACES.log.alert(this.id+'.cancel(): this.modal.input = '+this.modal.input);
    this.hideModal();
    //this.modal.escape();

    //this.modal.input.value=this.constants.EMPTY;
    this.modal=null;
  }

  ,hideModal:function(){
    ISPACES.log.debug(this.id+'.hideModal()');

    var modal=this.modal;
    if(modal){
      modal.on=false;
      modal.hide();
      //modal.cancel();
      //modal.escape();
      //this.modal=null;
    }

    this.resizableWindow.uncover();

    //this.apDiv.hi(this.apDiv._wh[1]);
    //ISPACES.log.alert(this.id+'.newFolder(): ISPACES.ui.unsetWH(this.apDiv)');
    //ISPACES.ui.unsetWH(this.apDiv); // After we reset the height of the addDiv, we unset it again so that it does not upset any resizing.
  }

  ,createCopyModal:function(){
    ISPACES.log.debug(this.id+'.createCopyModal()');

    var _this=this;
    var modal=this.createModal();

    var divCopy=this.create.div(this.create.txt(ISPACES.getString('Copy'))).setClass('txt')
    ,cellCopy=this.create.divCell(divCopy).setClass('txt-cell')
    ,rowCopy=this.create.divRow(cellCopy)
    ;

    var divTo=this.create.div(this.create.txt(ISPACES.getString('To'))).setClass('txt')
    ,cellTo=this.create.divCell(divTo).setClass('txt-cell')
    ,rowTo=this.create.divRow(cellTo)
    ;

    var divFrom=this.create.div().setClass('from-file')
    ,cellFrom=this.create.divCell(divFrom).setClass('file-cell')
    ,rowFrom=this.create.divRow(cellFrom)
    ;

    var divTarget=this.create.div().setClass('from-file')
    ,cellTarget=this.create.divCell(divTarget).setClass('file-cell')
    ,rowTarget=this.create.divRow(cellTarget)
    ;

    var buttonCopy=this.create.div(this.create.txt(ISPACES.getString('Copy'))).setClass('button')
    ,cellButtonCopy=this.create.divCell(buttonCopy).setClass('button-cell')
    ,rowButtonCopy=this.create.divRow(cellButtonCopy)
    ;

    var buttonMove=this.create.div(this.create.txt(ISPACES.getString('Move'))).setClass('button')
    ,cellMove=this.create.divCell(buttonMove).setClass('button-cell')
    ,rowButtonMove=this.create.divRow(cellMove)
    ;

    var divButtons=this.create.divTable([
      rowButtonCopy
      ,rowButtonMove
    ]).setClass('buttons');

    var divTable=this.create.divTable([
      rowCopy
      ,rowFrom
      ,rowTo
      ,rowTarget
      ,divButtons
    ]).setClass('inner');

    modal.add(divTable);

    // Set references to the 'from' and 'to' div.
    modal.divFrom=divFrom;
    modal.divTarget=divTarget; // @see copy() - copyModal.divTarget
    modal.moveCell=cellMove; // @see copy() - copyModal.divTarget
    modal.rowButtonMove=rowButtonMove; // @see copy() - copyModal.divTarget

    buttonCopy.addListener(
      this.constants.CLICK
      ,this.okCopy.bind(this,modal)
    );

    buttonMove.addListener(
      this.constants.CLICK
      ,this.okMove.bind(this,modal)
    );

    //modal.escapeKey=function(){
    //  _this.hideModal();
    //};
    modal.escapeKey=this.hideModal.bind(this);

    /*
    modal.enterKey=function(e){
      ISPACES.log.debug('modal.enterKey('+e+')');
      ISPACES.log.debug('modal.sourcePanel = '+modal.sourcePanel+', modal.targetPanel = '+modal.targetPanel);
      ISPACES.log.debug('this.sourcePanel = '+this.sourcePanel+', this.targetPanel = '+this.targetPanel);
      ISPACES.log.debug('modal.sourceLi = '+modal.sourceLi+', modal.targetLi = '+modal.targetLi);
      ISPACES.log.debug('this.sourceLi = '+this.sourceLi+', this.targetLi = '+this.targetLi);
      ISPACES.log.debug('this.fromUrl = "'+this.fromUrl+'", this.toUrl = "'+this.toUrl+'"');
      ISPACES.log.debug('modal.fromUrl = "'+modal.fromUrl+'", modal.toUrl = "'+modal.toUrl+'"');
      _this.okCopy(modal);
    };
    //modal.fromUrl=fromUrl;
    //modal.toUrl=toUrl;
    */
    modal.enterKey=this.okCopy.bind(this,modal);

    return modal;
  }

  ,okCopy:function(modal){
    ISPACES.log.debug(this.id+'.okCopy('+modal+')');

    /*
     * Create the progress modal after a timeout period.
     */
    this.progressCall=new ISPACES.AsyncCall(
      this
      ,"progress"
      ,this.PROGRESS_WAIT
    );

    //ISPACES.log.debug('modal.sourcePanel = '+modal.sourcePanel);
    //ISPACES.log.debug('modal.targetPanel = '+modal.targetPanel);
    /*
    ISPACES.log.debug('modal.sourcePanel.isLocal = '+modal.sourcePanel.isLocal);
    ISPACES.log.debug('modal.sourcePanel.url = '+modal.sourcePanel.url);
    ISPACES.log.debug('modal.targetPanel.isLocal = '+modal.targetPanel.isLocal);
    ISPACES.log.debug('modal.targetPanel.url = '+modal.targetPanel.url);
    */

    var fromUrl=modal.fromUrl
    ,toUrl=modal.toUrl
    ,targetPanel=modal.targetPanel
    ,targetLi=modal.targetLi
    ,fromIsLocal=false
    ,toIsLocal=targetPanel.isLocal
    ,sourcePanel=modal.sourcePanel
    ;

    var lastIndexOfFileSeparator=fromUrl.lastIndexOf(this.constants.FSLASH);
    var fileName=fromUrl.substring(lastIndexOfFileSeparator+1);
    lastIndexOfFileSeparator=toUrl.lastIndexOf(this.constants.FSLASH);
    toUrl=toUrl.substring(0,lastIndexOfFileSeparator+1)+fileName;

    if(sourcePanel){
      fromIsLocal=sourcePanel.isLocal
    }

    //ISPACES.log.debug('fileName    = "'+fileName+'"');
    //ISPACES.log.debug('fromUrl     = "'+fromUrl+'"');
    //ISPACES.log.debug('toUrl       = "'+toUrl+'"');
    //ISPACES.log.debug('sourcePanel = '+sourcePanel);
    //ISPACES.log.debug('targetPanel = '+targetPanel);
    //ISPACES.log.debug('targetLi    = '+targetLi);
    //ISPACES.log.debug('fromIsLocal = '+fromIsLocal);
    //ISPACES.log.debug('toIsLocal   = '+toIsLocal);

    if(fromIsLocal){ // Copying a local file,
      if(toIsLocal){ // 1) to a local file.
        ISPACES.log.debug('fromIsLocal && toIsLocal');

        var copied=ISPACES.files.copyFile({f:fromUrl,t:toUrl});
        //ISPACES.log.debug('copied = '+copied);

        this.copied(
          copied?1:0
          ,{
            'f':fromUrl
            ,'t':toUrl
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceLi:sourceLi
            ,targetLi:targetLi
          }
        );

      }else{         // 2) to a remote file.
        ISPACES.log.debug('fromIsLocal && !toIsLocal');

        var _this=this;

        var callback=function(copied){
          ISPACES.log.debug('callback(copied:'+copied+')');

          _this.copied(
            copied?1:0
            ,{
              'f':fromUrl
              ,'t':toUrl
              ,sourcePanel:sourcePanel
              ,targetPanel:targetPanel
              //,sourceLi:sourceLi
              ,targetLi:targetLi
            }
          );
        };

        var args={
          f:fromUrl
          ,t:toUrl
          ,callback:callback
        };

        /*
         * Even though this is an Asynchronous call, the applet hangs until the method returns... need to add this to a seperate thread and provide a callback, so that the UI is not held up.
         */
        new ISPACES.AsyncApply(
          ISPACES.files
          ,"upload"
          ,[args]
          ,100
        );

      }

    }else{ // Copying a remote file,
      if(toIsLocal){ // 1) to a local file. Downloading.
        ISPACES.log.debug('!fromIsLocal && toIsLocal');

        /*
        var _size=this.leftRight._size; // Get the size for efficient buffering.
        ISPACES.log.debug(this.id+'.okCopy(): _size = '+_size);

        //new ISPACES.Ajax(contextUrl+'/upload',function(r){ISPACES.log.alert(r)}).upload({f:fromUrl,t:toUrl}); // Where we have multiple files being copied the fromUrl object can be an array for file URLs.
        var copied=phoneAppletCommander.download({f:fromUrl,t:toUrl,s:_size});
        ISPACES.log.debug(this.id+'.okCopy(): copied = '+copied);
        var o={
          'f':fromUrl
          ,'t':toUrl
        };
        this.copied(copied,o);
        */
        var copied=ISPACES.files.download({f:fromUrl,t:toUrl});
        //ISPACES.log.debug('copied = '+copied);

        this.copied(
          copied?1:0
          ,{
            'f':fromUrl
            ,'t':toUrl
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceLi:sourceLi
            ,targetLi:targetLi
          }
        );

      }else{          // 2) to a remote file. Remote rename operation.
        ISPACES.log.debug('!fromIsLocal && !toIsLocal');

        var callback={
          '_this':this
          ,'fn':"copied"
          ,'params':{
            'f':fromUrl
            ,'t':toUrl
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceLi:sourceLi
            ,targetLi:targetLi
          }
        };

        new ISPACES.Ajax(contextUrl+'/copy',callback).send({f:fromUrl,t:toUrl}); // Where we have multiple files being copied the fromUrl object can be an array for file URLs.

        /*
        var url=new ISPACES.StringBuilder([
          contextUrl
          ,'/copy'
          ,'?f=',encodeURIComponent(fromUrl)
          ,'&t=',encodeURIComponent(toUrl)
        ]).asString();
        ISPACES.log.alert('!fromIsLocal && !toIsLocal: url = '+url);

        new ISPACES.Ajax(
          url
          ,callback
        ).doGet();
        */

      }
    }
  }

  ,copied:function(r,o){
    ISPACES.log.debug(this.id+'.copied('+r+', '+o+')');

    /*
     * Cancel the progress.
     */
    if(this.progressCall){
      this.progressCall.cancel();
      this.progressCall=null;
    }

    //ISPACES.log.debug('o.f = "'+o.f+'"');
    //ISPACES.log.debug('o.t = "'+o.t+'"');

    var sourcePanel=o.sourcePanel,targetPanel=o.targetPanel;
    //ISPACES.log.debug('sourcePanel = '+sourcePanel);
    //ISPACES.log.debug('targetPanel = '+targetPanel);
    //ISPACES.log.debug('sourcePanel.protocol = '+sourcePanel.protocol);
    //ISPACES.log.debug('targetPanel.protocol = '+targetPanel.protocol);

    this.hideModal();

    //ISPACES.log.debug('typeof r = '+typeof r);

    //var copied=parseInt(r)||r=='true';
    //ISPACES.log.debug('copied = '+copied);

    var sound;
    if(parseInt(r)){
    //if(copied){

      sound="copy";

      var from=o.f,to=o.t;

      //var panelIndex=o.panelIndex,panelIndexPrev=o.panelIndexPrev;
      //ISPACES.log.debug('panelIndex = '+panelIndex+', panelIndexPrev = '+panelIndexPrev);
      //var sourcePanel=o.sourcePanel,targetPanel=o.targetPanel;
      //ISPACES.log.debug('sourcePanel = '+sourcePanel+', targetPanel = '+targetPanel);

      /*
      var fileMap=files.copy(protocol,path);
      var fileTable=this.createFileTable(protocol,parentNameAndPath[1],fileMap,this.fileDiv); // Create the new file table.
      this.fileDiv.replaceFirst(fileTable); // Replace the old file table with the new one.
      this.trMouseDown(null,fileTable.tbody.fC(),this.fileDiv); // Simulate the mouse down on the first row, to select it.
      this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
      */

      var a=from.split(this.constants.COLON);
      var fromProtocol=a[0];
      var fromPath=a[1];
      //ISPACES.log.debug('fromProtocol = '+fromProtocol+', fromPath = '+fromPath);

      a=to.split(this.constants.COLON);
      var toProtocol=a[0];
      var toPath=a[1];
      //ISPACES.log.debug('toProtocol = '+toProtocol+', toPath = '+toPath);

      /*
      var copyFile=ISPACES.files.get(this.root,fromPath);
      ISPACES.log.debug('copyFile = '+copyFile);
      var protocolAndPath=o.t.split(this.constants.COLON);
      var protocol=protocolAndPath[0];
      var path=protocolAndPath[1];
      var parentNameAndPath=this.getParentNameAndPath(path);

      ISPACES.log.debug('protocol = '+protocol+', path = '+path);
      */

      /*
      var leftRight=this.leftRight==this.left?this.right:this.left;
      var fileDiv=this.fileDiv==this.leftFileDiv?this.rightFileDiv:this.leftFileDiv;
      //var url=leftRight.url;

      var fileMap=files.create(protocol,path,copyFile);
      var fileUl=this.createFileUl(this.root,parentNameAndPath[1],fileMap,fileDiv); // Create the new file listing.
      fileDiv.replaceFirst(fileUl); // Replace the old file listing with the new one.
      this.trMouseDown(null,fileUl.fC(),fileDiv); // Simulate the mouse down on the first row, to select it.
      //this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
      */

      ISPACES.spaces.space.desktop.refresh(); // Do we need the refresh the current desktop?

      var targetLi=o.targetLi;
      //ISPACES.log.debug('targetLi = '+targetLi);

      if(targetLi){

        //ISPACES.log.debug('targetLi.url = '+targetLi.url);
        //ISPACES.log.debug('targetLi.parentUl = '+targetLi.parentUl);
        //ISPACES.log.debug('targetLi.parentUl.li = '+targetLi.parentUl.li);
        //if(targetLi.parentUl.li)ISPACES.log.debug('targetLi.parentUl.li.url = '+targetLi.parentUl.li.url);

        if(!targetLi.isDir)targetLi=targetLi.parentUl.li;
      }

      if(targetLi){

        this.refreshLi(
          targetLi
          ,targetPanel
        );

      }else{
        this.refreshPanel(targetPanel);
      }

    }else{
      sound="access-denied";
    }

    ISPACES.sounds.play(sound);
  }


  /*
   * Progress Modal
   */

  ,progress:function(
    e
    //sourcePanel
  ){
    ISPACES.log.debug(this.id+'.progress('+e+')');

    if(e)Common.killEvent(e); // We have to kill the event, otherwise it closes the modal

    this.cancel();

    var modal=this.progressModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){ // If the modal has not been created before, create it.
      modal=this.progressModal=this.createProgressModal();
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    this.spinner.start();

    modal.show();
    centeringTable.show();

    modal.on=true;
    this.modal=modal;

    new ISPACES.AsyncCall( // We have to asynchronously set the escape as the mouseup escapes this.
      null
      ,function(){
        //ISPACES.log.debug('ISPACES.AsyncCall(): ISPACES.global.escapeKeyObject=modal;');
        ISPACES.global.escapeKeyObject=modal; // escape key
        ISPACES.global.escapeObject=modal; // escape click
      }
      ,100
    );

  }

  ,createProgressModal:function(){
    ISPACES.log.debug(this.id+'.createProgressModal()');

    var _this=this;

    //var modal=this.createModal();
    var modal=this.create.div().setClass('modal');

    //*
    modal.escape=function(){
      ISPACES.log.debug(_this.id+'.createProgressModal(): modal.escape()');
      //ISPACES.svg.stop();
      _this.spinner.stop();
      _this.hideModal();
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
    };

    modal.enterKey=function(e){
      ISPACES.log.debug(_this.id+'.createProgressModal(): modal.enterKey('+e+')');
      this.escape();
    };
    //*/

    /*
    var closeButton=modal.closeButton;
    closeButton.addListener(
      this.constants.MOUSEDOWN
      //,function(e){
      //  Common.stopEvent(e);
      //}
      ,modal.escape
      ,false
    );
    */

    /*
    var uploadingTxt=this.create.div(this.create.txt('Progress...')).setClass('txt')
    ,uploadingTxtCell=this.create.divCell(uploadingTxt).setClass('txt-cell')
    ,uploadingTxtRow=this.create.divRow(uploadingTxtCell)
    ;
    */

    /*
     * 2012 encoded spinner
     */
    //Common.required("Spinner",true);

    var strokeWidth=3
    ,outerRadius=20
    ,innerRadius=12
    ,spokeCount=12
    ,color='#026799'
    ,frequency=1000  // in milliseconds
    ;

    //var svg=document.createElementNS('http://www.w3.org/2000/svg',Constants.Tags.SVG);
    var svg=document.createElementNS(Constants.Urls.SVG,Constants.Tags.SVG);
    //ISPACES.log.debug('svg = '+svg);

    var spinner=new ISPACES.Spinner(
      svg
      ,innerRadius
      ,outerRadius
      ,spokeCount
      ,strokeWidth
      ,color
      ,frequency // in milliseconds
    );

    this.spinner=spinner; // Set a local reference to the newly created spinner, so we can start and stop the spinner.

    //var svgWidth=((outerRadius*2)+(strokeWidth*2));
    var svgWidth=spinner.getWidth();
    //ISPACES.log.debug('svgWidth = '+svgWidth);

    //svg.setAttributeNS(null,'width',svgWidth);
    //svg.setAttributeNS(null,'height',svgWidth);
    svg.width.baseVal.valueAsString=svgWidth+'px';
    svg.height.baseVal.valueAsString=svgWidth+'px';
    svg.width.baseVal.value=svgWidth;
    svg.height.baseVal.value=svgWidth;

    var divSpinner=this.create.div(svg)
    ,cellSpinner=this.create.divCell(divSpinner)
    ,rowSpinner=this.create.divRow(cellSpinner)
    ;

    //divSpinner.bo(Constants.Borders.BORE);
    divSpinner.pa('10px');
    divSpinner.alCM();

    //cellSpinner.bo(Constants.Borders.BLACK);
    //cellSpinner.pa('10px');
    cellSpinner.alCM();

    var divClose=this.create.div(this.create.txt(ISPACES.getString('Close'))).setClass('button')
    ,cellClose=this.create.divCell(divClose).setClass('button-cell')
    ,rowClose=this.create.divRow(cellClose)
    ;

    divClose.addListener(
      //this.constants.CLICK
      this.constants.MOUSEDOWN
      ,modal.escape
      //,false
      ,true
    );

    var divButtons=this.create.divTable(rowClose).setClass('buttons');

    var divTable=this.create.divTable([
      //uploadingTxtRow
      rowSpinner
      ,divButtons
    ]).setClass('inner');

    modal.add(divTable);

    return modal;
  }


  /*
   * Move Modal
   */

  ,move:function(e){
    ISPACES.log.debug(this.id+'.move('+e+')');

    Common.killEvent(e); // We have to kill the event, otherwise it closes the modal

    var panelCell=this.panelCell
    ,panelLi
    ,isLocal
    ;

    if(panelCell){ // is there a panel selected
      panelLi=panelCell.li;
      isLocal=panelCell.isLocal;
      if(!panelLi){
        var toProtocol=panelCell.protocol; // check for a panel selected
        //ISPACES.log.debug('toProtocol = "'+toProtocol+'"');
        if(!toProtocol){
          this.error(ISPACES.getString('Please select a file or folder to move'));
          return;
        }
      }
    }else{
      this.error(ISPACES.getString('Please select a file or folder to delete'));
      return;
    }

    var modal=this.moveModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){
      modal=this.moveModal=this.createMoveModal();
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    // Set the escape route. Set the escape function for the global escape catcher.
    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
    };
    ISPACES.global.escapeKeyObject=modal; // escape key
    ISPACES.global.escapeObject=modal; // escape click


    /*
     * from
     */
    var divFrom=modal.divFrom;
    var fromFileName;
    var fromUrl;
    var sourceIsDir;

    /*
     * to
     */
    var divTarget=modal.divTarget;
    var toUrl;
    var toIsDir;

    if(this.panelCell&&this.previousPanel){ // Make sure there are selected files/folders.

      var sourceLi=this.panelCell.li;
      var targetLi=this.previousPanel.li;

      //ISPACES.log.debug('sourceLi.url = '+sourceLi.url);
      //ISPACES.log.debug('targetLi.url = '+targetLi.url);

      if(sourceLi){
        fromUrl=sourceLi.url;
        fromFileName=sourceLi.fileName;
        sourceIsDir=sourceLi.isDir;
      }

      if(targetLi){
        toUrl=targetLi.url;
        toIsDir=targetLi.isDir;
      }

    } // if(this.panelCell&&this.previousPanel)

    //ISPACES.log.debug('fromUrl      = "'+fromUrl+'"');
    //ISPACES.log.debug('sourceIsDir    = '+sourceIsDir);
    //ISPACES.log.debug('fromFileName = "'+fromFileName+'"');
    //ISPACES.log.debug('toUrl        = "'+toUrl+'"');
    //ISPACES.log.debug('toIsDir      = '+toIsDir);


    /*
     * from
     */
    //var ext=ISPACES.applications.getExt(fromFileName);
    //var char=ISPACES.MimeTypes.getChar(ext);
    var ext;
    var char;

    if(sourceIsDir){

      ext='folder';
      char='H';
      divFrom.sA('type','folder');

    }else{

      var lastIndexOfDot=fromFileName.lastIndexOf(Constants.Characters.DOT);
      //ISPACES.log.debug('lastIndexOfDot = '+lastIndexOfDot);
      if(lastIndexOfDot!=-1){
        ext=fromFileName.substring(lastIndexOfDot+1);
      }else{
        ext='default';
      }
      //ISPACES.log.debug('ext = "'+ext+'"');

      char=ISPACES.MimeTypes.getChar(ext);
      //ISPACES.log.debug('char = "'+char+'"');
      if(!char)char='a';

      divFrom.sA('type','file');
    }

    //ISPACES.log.debug('ext = '+ext);
    //ISPACES.log.debug('char = '+char);

    divFrom.replaceFirst(this.create.txt(fromFileName));
    divFrom.sA('ext',ext);
    divFrom.sA('char',char);


    /*
     * to
     */
    var sb=new ISPACES.StringBuilder();
    if(toIsDir){
      sb.appendAll([
        toUrl
        ,'/'
        ,fromFileName
      ]);
    }else{ // Get the parent directory name from the fileName
      var lastIndexOfFslash=toUrl.lastIndexOf(this.constants.FSLASH);
      sb.appendAll([
        toUrl.substring(0,(lastIndexOfFslash+1))
        ,fromFileName
      ]);
    }
    toUrl=sb.asString();
    //ISPACES.log.debug('toUrl = "'+toUrl+'"');

    var a=toUrl.split(this.constants.COLON);
    var protocol=a[0];
    //ISPACES.log.debug('protocol = "'+protocol+'"');

    divTarget.replaceFirst(this.create.txt(toUrl));
    divTarget.sA('protocol',protocol);
    divTarget.sA('type','file');
    divTarget.sA('char',char);
    //divTarget.sA('ext',ext);

    modal.fromUrl=fromUrl;
    modal.toUrl=toUrl;

    modal.show();
    centeringTable.show();

    modal.on=true;
    this.modal=modal;
  }

  ,createMoveModal:function(){
    ISPACES.log.debug(this.id+'.createMoveModal()');

    var _this=this;

    var modal=this.createModal();

    var txtDiv0=this.create.div(this.create.txt(ISPACES.getString('Move'))).setClass('txt');
    var txtDiv1=this.create.div(this.create.txt(ISPACES.getString('To'))).setClass('txt');

    var divFrom=this.create.div().setClass('from-file');
    modal.divFrom=divFrom;

    var divTarget=this.create.div().setClass('to-file');
    modal.divTarget=divTarget;

    var buttonMove=this.create.div(this.create.txt(ISPACES.getString('Move'))).setClass('button')
    ,cellMove=this.create.divCell(buttonMove).setClass('button-cell')
    ,rowButtonMove=this.create.divRow(cellMove)
    ;

    buttonMove.addListener(
      this.constants.CLICK
      ,this.okMove.bind(this,modal)
    );

    var divTable=this.create.divTable(rowButtonMove).setClass('buttons');

    var innerDiv=this.create.div([
      txtDiv0
      ,divFrom
      ,txtDiv1
      ,divTarget
      ,divTable
    ]).setClass('inner');

    modal.add(innerDiv);

    modal.escapeKey=function(){
      _this.hideModal();
    };

    modal.enterKey=function(e){
      ISPACES.log.debug(this.id+'.createMoveModal(): modal.enteryKey()');
      _this.okMove();
    };

    return modal;
  }

  ,okMove:function(modal){
    ISPACES.log.debug(this.id+'.okMove('+modal+')');

    this.progressCall=new ISPACES.AsyncCall(
      this
      ,"progress"
      ,this.PROGRESS_WAIT
    );

    var sourcePanel=modal.sourcePanel
    ,targetPanel=modal.targetPanel
    ,fromUrl=modal.fromUrl
    ,toUrl=modal.toUrl
    ,sourceLi=modal.sourceLi
    ,targetLi=modal.targetLi
    ,fromIsLocal=sourcePanel.isLocal
    ,toIsLocal=targetPanel.isLocal
    ;

    //ISPACES.log.debug('sourcePanel = '+sourcePanel);
    //ISPACES.log.debug('targetPanel = '+targetPanel);
    //ISPACES.log.debug('sourceLi = "'+sourceLi+'"');
    //if(sourceLi)ISPACES.log.debug('sourceLi.url = "'+sourceLi.url+'"');
    //ISPACES.log.debug('targetLi = "'+targetLi+'"');
    //if(targetLi)ISPACES.log.debug('targetLi.url = "'+targetLi.url+'"');
    //ISPACES.log.debug('fromUrl = "'+fromUrl+'"');
    //ISPACES.log.debug('toUrl = "'+toUrl+'"');
    //ISPACES.log.debug('fromIsLocal = '+fromIsLocal);
    //ISPACES.log.debug('toIsLocal = '+toIsLocal);

    var lastIndexOfFileSeparator=fromUrl.lastIndexOf(this.constants.FSLASH);
    var fileName=fromUrl.substring(lastIndexOfFileSeparator+1);
    //ISPACES.log.debug('fileName = "'+fileName+'"');

    lastIndexOfFileSeparator=toUrl.lastIndexOf(this.constants.FSLASH);
    toUrl=toUrl.substring(0,lastIndexOfFileSeparator+1)+fileName;

    if(fromIsLocal){ // Moveing a local file,
      if(toIsLocal){ // 1) to a local file.
        ISPACES.log.debug('fromIsLocal && toIsLocal');

        //var moved=ISPACES.files.renameFile({f:fromUrl,t:toUrl});
        var moved=ISPACES.files.renameFile(fromUrl,toUrl);
        ISPACES.log.debug('moved = '+moved);

        //this.moved();
        this.moved(

          moved?1:0

          ,{
            'f':fromUrl
            ,'t':toUrl
            ,sourceLi:sourceLi
            ,targetLi:targetLi
            ,"sourcePanel":sourcePanel
            ,"targetPanel":targetPanel
          }

        );

        /*
        var copied=phoneAppletCommander.renameFile({f:fromUrl,t:toUrl});
        ISPACES.log.debug(this.id+'.okMove(): copied = '+copied);
        var o={
          'f':fromUrl
          ,'t':toUrl
        };
        if(copied)this.copied(1,o);
        */

      }else{         // 2) to a remote file.
        ISPACES.log.debug('fromIsLocal && !toIsLocal');

        /*
        var _size=this.leftRight._size; // Get the size for efficient buffering.
        ISPACES.log.debug(this.id+'.okMove(): size');

        //new ISPACES.Ajax(contextUrl+'/upload',function(r){ISPACES.log.alert(r)}).upload({f:fromUrl,t:toUrl}); // Where we have multiple files being copied the fromUrl object can be an array for file URLs.
        var copied=phoneAppletCommander.upload({f:fromUrl,t:toUrl,s:_size});
        ISPACES.log.debug(this.id+'.okMove(): copied = '+copied);
        var o={
          'f':fromUrl
          ,'t':toUrl
        };
        this.copied(copied,o);
        */


      }

    }else{ // Moving a remote file,
      if(toIsLocal){ // 1) to a local file. Downloading.
        ISPACES.log.debug('!fromIsLocal && toIsLocal');

        /*
        var _size=this.leftRight._size; // Get the size for efficient buffering.
        ISPACES.log.debug(this.id+'.okMove(): _size = '+_size);

        //new ISPACES.Ajax(contextUrl+'/upload',function(r){ISPACES.log.alert(r)}).upload({f:fromUrl,t:toUrl}); // Where we have multiple files being copied the fromUrl object can be an array for file URLs.
        var copied=phoneAppletCommander.download({f:fromUrl,t:toUrl,s:_size});
        ISPACES.log.debug(this.id+'.okMove(): copied = '+copied);
        var o={
          'f':fromUrl
          ,'t':toUrl
        };
        this.copied(copied,o);
        */

        var copied=ISPACES.files.download({f:fromUrl,t:toUrl});
        //ISPACES.log.debug('copied = '+copied);

        this.copied(
          copied?1:0
          ,{
            'f':fromUrl
            ,'t':toUrl
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceLi:sourceLi
            ,targetLi:targetLi
          }
        );

      }else{          // 2) to a remote file - rename operation.
        ISPACES.log.debug('!fromIsLocal && !toIsLocal');

        var callback={
          '_this':this
          ,'fn':"moved"
          ,'params':{
            'f':fromUrl
            ,'t':toUrl
            ,"sourceLi":sourceLi
            ,"targetLi":targetLi
            ,"sourcePanel":sourcePanel
            ,"targetPanel":targetPanel
          }
        };

        new ISPACES.Ajax(contextUrl+'/move',callback).send({f:fromUrl,t:toUrl}); // Where we have multiple files being copied the fromUrl object can be an array for file URLs.

      }
    }

  }

  ,moved:function(r,o){
    ISPACES.log.debug(this.id+'.moved(r:'+r+', o:'+o+')');

    /*
     * Cancel the progress.
     */
    if(this.progressCall){
      this.progressCall.cancel();
      this.progressCall=null;
    }

    //ISPACES.log.debug('o.f = "'+o.f+'"');
    //ISPACES.log.debug('o.t = "'+o.t+'"');
    //ISPACES.log.debug('o.sourcePanel = '+o.sourcePanel);
    //ISPACES.log.debug('o.targetPanel = '+o.targetPanel);
    //ISPACES.log.debug('o.sourceLi = '+o.sourceLi);
    //ISPACES.log.debug('o.targetLi = '+o.targetLi);

    var sourcePanel=o.sourcePanel,targetPanel=o.targetPanel;
    //ISPACES.log.debug('sourcePanel = '+sourcePanel+', targetPanel = '+targetPanel);
    var sourceLi=o.sourceLi,targetLi=o.targetLi;
    //ISPACES.log.debug('sourceLi = '+sourceLi+', targetLi = '+targetLi);

    this.hideModal();

    var dataUrl;
    var sound;

    if(parseInt(r)){

      //ISPACES.log.debug('o.f="'+o.f+'", o.t="'+o.t+'"');

      //dataUrl=contextUrl+'/view/audio/email.wav';
      //dataUrl=contextUrl+'/view/audio/284138_RopeSwishOrArmSwish01.wav';
      //dataUrl=contextUrl+'/view/audio/copy.wav';
      sound="copy";

      var from=o.f,to=o.t;

      //var panelIndex=o.panelIndex,panelIndexPrev=o.panelIndexPrev;
      //ISPACES.log.debug('panelIndex = '+panelIndex+', panelIndexPrev = '+panelIndexPrev);
      //var sourcePanel=o.sourcePanel,targetPanel=o.targetPanel;
      //ISPACES.log.debug('sourcePanel = '+sourcePanel+', targetPanel = '+targetPanel);

      /*
      var fileMap=files.copy(protocol,path);
      var fileTable=this.createFileTable(protocol,parentNameAndPath[1],fileMap,this.fileDiv); // Create the new file table.
      this.fileDiv.replaceFirst(fileTable); // Replace the old file table with the new one.
      this.trMouseDown(null,fileTable.tbody.fC(),this.fileDiv); // Simulate the mouse down on the first row, to select it.
      this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
      */

      var a=from.split(this.constants.COLON);
      var fromProtocol=a[0];
      var fromPath=a[1];
      //ISPACES.log.debug('fromProtocol = '+fromProtocol+', fromPath = '+fromPath);

      a=to.split(this.constants.COLON);
      var toProtocol=a[0];
      var toPath=a[1];
      //ISPACES.log.debug('toProtocol = '+toProtocol+', toPath = '+toPath);

      /*
      var copyFile=ISPACES.files.get(this.root,fromPath);
      ISPACES.log.debug('copyFile = '+copyFile);
      var protocolAndPath=o.t.split(this.constants.COLON);
      var protocol=protocolAndPath[0];
      var path=protocolAndPath[1];
      var parentNameAndPath=this.getParentNameAndPath(path);

      ISPACES.log.debug('protocol = '+protocol+', path = '+path);
      */

      /*
      var leftRight=this.leftRight==this.left?this.right:this.left;
      var fileDiv=this.fileDiv==this.leftFileDiv?this.rightFileDiv:this.leftFileDiv;
      //var url=leftRight.url;

      var fileMap=files.create(protocol,path,copyFile);
      var fileUl=this.createFileUl(this.root,parentNameAndPath[1],fileMap,fileDiv); // Create the new file listing.
      fileDiv.replaceFirst(fileUl); // Replace the old file listing with the new one.
      this.trMouseDown(null,fileUl.fC(),fileDiv); // Simulate the mouse down on the first row, to select it.
      //this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
      */

      ISPACES.spaces.space.desktop.refresh(); // Do we need the refresh the current desktop?
      //this.refreshPanel(panelIndexPrev);
      //if(targetPanel)this.refreshPanel(targetPanel);

      //if(sourceLi)this.refreshLi(sourceLi);
      //if(targetLi)this.refreshLi(targetLi);

      if(targetLi){
        this.refreshLi(
          targetLi
          ,targetPanel
        );
      }else{
        this.refreshPanel(targetPanel);
      }

      if(sourceLi){
        this.refreshLi(
          sourceLi
          ,sourcePanel
        );
      }else{
        this.refreshPanel(sourcePanel);
      }

    }else{
      sound="access-denied";
    }

    ISPACES.sounds.play(sound);
  }


  /*
   * Delete Modal
   */

  ,del:function(e){
    ISPACES.log.debug(this.id+'.del('+e+')');

    Common.killEvent(e); // kill the event, otherwise it closes the modal
    //var _this=this;

    var panelCell=this.panelCell
    ,panelLi
    ,isLocal
    ;

    if(panelCell){ // is there a panel selected
      panelLi=panelCell.li;
      isLocal=panelCell.isLocal;
      if(!panelLi){
        var toProtocol=panelCell.protocol; // check for a panel selected
        //ISPACES.log.debug('toProtocol = "'+toProtocol+'"');
        if(!toProtocol){
          this.error(ISPACES.getString('Please select a file or folder to delete'));
          return;
        }
      }
    }else{
      this.error(ISPACES.getString('Please select a file or folder to delete'));
      return;
    }

    //ISPACES.log.debug('panelCell   = '+panelCell);
    //ISPACES.log.debug('panelLi = '+panelLi);
    //ISPACES.log.debug('isLocal = '+isLocal);

    var modal=this.deleteModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    //ISPACES.log.debug('modal = '+modal);
    //ISPACES.log.debug('resizableWindow = '+resizableWindow);
    //ISPACES.log.debug('centeringTable = '+centeringTable);

    /*
     * Cover the app and set the escape mechanism. Covering the app creates the greyout layer.
     * We call resizableWindow.cover() before resizableWindow.addCenteringTable() so the z-index of the centering table can be greater than the greyout.
     */
    //resizableWindow.cover('0.6','#000');
    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){ // If the modal has not been created before, create it.
      //modal=this.deleteModal=this.create.deleteModal();
      modal=this.deleteModal=this.createDeleteModal();
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    // Set the escape route. Set the escape function for the global escape catcher.
    var _this=this;
    modal.escape=function(){
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
      resizableWindow.uncover();
      _this.cancel();
    };
    ISPACES.global.escapeKeyObject=modal; // Allow the user to escape out of copy modal.
    ISPACES.global.escapeObject=modal; // Allow the user to escape out of copy modal.

    /*
     * from
     */
    var li;
    if(e){
      //ISPACES.log.debug('e.targetElement = '+e.targetElement);
      li=e.targetElement;
    }
    if(!li){
      //ISPACES.log.debug('panelCell = '+panelCell);
      //ISPACES.log.debug('panelCell.li = '+panelCell.li);
      li=panelCell.li;
    }
    //ISPACES.log.debug('li = '+li);
    modal.li=li; // Allows the list item to be removed after deletion.

    var url=li.url;
    var fileName=li.fileName;
    var isDir=li.isDir;
    var isRecycle=url.indexOf('/.recycle')!=-1;
    //var ext=ISPACES.applications.getExt(fileName);
    //var char=ISPACES.MimeTypes.getChar(ext);

    //ISPACES.log.debug('url       = "'+url+'"');
    //ISPACES.log.debug('isDir     = '+isDir);
    //ISPACES.log.debug('isRecycle = '+isRecycle);
    //ISPACES.log.debug('fileName  = "'+fileName+'"');
    //ISPACES.log.debug('ext       = "'+ext+'"');
    //ISPACES.log.debug('char      = "'+char+'"');

    /*
     * Set some references on the modal to be picked up after the confirmation.
     */
    modal.url=url;
    modal.isLocal=isLocal;

    var divFrom=modal.divFrom;
    divFrom.replaceFirst(this.create.txt(fileName));
    //divFrom.url=url; // Set the URL as a property of the divFrom.
    //divFrom.sA('ext',ext);
    //divFrom.sA('char',char);
    //divFrom.sA('type','file');

    var ext;
    var char;

    if(isDir){

      var message=new ISPACES.StringBuilder([
        //'You are about to permanently delete the folder \''
        ISPACES.getString('You are about to permanently delete the folder \'')
        ,fileName
        //,'\' and all of its contents.'
        ,ISPACES.getString('\' and all of its contents.')
      ]).asString();

      var div=this.create.div([
        this.create.txt(message)
        ,this.create.tag('br')
        ,this.create.txt(ISPACES.getString('Are you sure?'))
      ]);
      div.style['lineHeight']='33px';
      div.alCM();

      //modal.divMessage.replaceFirst(Common.Create.txt(message));
      modal.divMessage.replaceFirst(div);

      ext='folder';
      char='H';
      divFrom.sA('type','folder');

    }else{

      var lastIndexOfDot=fileName.lastIndexOf(Constants.Characters.DOT);
      //ISPACES.log.debug('lastIndexOfDot = '+lastIndexOfDot);
      if(lastIndexOfDot!=-1){
        ext=fileName.substring(lastIndexOfDot+1);
      }else{
        ext='default';
      }
      //ISPACES.log.debug('ext = "'+ext+'"');

      char=ISPACES.MimeTypes.getChar(ext);
      if(!char)char='a';
      //ISPACES.log.debug('char = "'+char+'"');

      divFrom.sA('type','file');
    }

    divFrom.sA('ext',ext);
    divFrom.sA('char',char);


    /*
     * Show the modal.
     */
    if(isRecycle){
      modal.recycleCell.hide();
    }else{
      modal.recycleCell.show();
    }
    modal.show();
    centeringTable.show();

    modal.on=true;
    this.modal=modal;
  }

  ,createDeleteModal:function(){
    ISPACES.log.debug(this.id+'.createDeleteModal()');

    var create=this.create
    ,modal=this.createModal()
    ,divDelete=create.div(create.txt(ISPACES.getString('Delete'))).setClass('txt')
    ,divFrom=create.div().setClass('from-file')
    ;

    var divMessage=create.div().setClass('txt')
    ,cellMessage=create.divCell(divMessage).setClass('txt-cell')
    ,rowMessage=create.divRow(cellMessage)
    ;

    var buttonRecycle=create.div(create.txt(ISPACES.getString('Recycle'))).setClass('button')
    ,cellRecycle=create.divCell(buttonRecycle).setClass('button-cell')
    ,rowRecycle=create.divRow(cellRecycle)
    ;

    var buttonDelete=create.div(create.txt(ISPACES.getString('Delete'))).setClass('button')
    ,cellDelete=create.divCell(buttonDelete).setClass('button-cell')
    ,rowDelete=create.divRow(cellDelete)
    ;

    var divTable=create.divTable([
      rowRecycle
      ,rowDelete
    ]).setClass('buttons');

    var innerDiv=create.div([
      divDelete
      ,rowMessage
      ,divFrom
      ,divTable
    ]).setClass('inner');

    modal.add(innerDiv);

    buttonDelete.addListener(
      this.constants.CLICK
      ,this.okDelete.bind(this,modal)
    );

    var _this=this;

    buttonRecycle.enterKeyFunction=function(e){
      ISPACES.log.debug('buttonRecycle.enterKeyFunction('+e+')');

      Common.stopEvent(e); // There is an onclick handler in the resizableWindow.centeringTable. Prevent the event from propogating there.

      //_this.recycle();

      new ISPACES.Ajax(

        new ISPACES.StringBuilder([
          contextUrl
          ,'/recycle/'
          ,modal.url
        ]).asString()

        ,function(r){
          ISPACES.log.debug('buttonRecycle.enterKeyFunction('+e+'): callback('+r+')');

          var sound;
          if(parseInt(r)){

            sound="recycle";

            //modal.li.rm(); // remove the list item from the DOM

            var li=modal.li;
            var parentUl=li.parentNode;
            var parentLi=li.parentUl.li;
            ISPACES.log.debug('li = '+li);
            ISPACES.log.debug('parentUl = '+parentUl);
            ISPACES.log.alert('parentUl = '+parentUl);
            ISPACES.log.debug('parentLi = '+parentLi);

            //modal.li.rm(); // remove the list item from the DOM
            //modal.li.rm(); // remove the list item from the DOM
            //modal.li.parentNode.remove(modal.li); // remove the list item from the DOM
            parentUl.remove(li); // remove the list item from the DOM

            _this.refreshLi(parentLi);

          }else{
            sound="access-denied";
          }

          _this.hideModal();

          ISPACES.sounds.play(sound);
        }

      ).doGet();

    };

    buttonRecycle.addListener(
      this.constants.CLICK
      ,buttonRecycle.enterKeyFunction
    );


    modal.divFrom=divFrom;
    modal.divMessage=divMessage;
    modal.recycleCell=cellRecycle;
    modal.escapeKey=this.hideModal.bind(this);
    modal.enterKey=buttonRecycle.enterKeyFunction;

    return modal;
  }

  ,okDelete:function(modal){
    ISPACES.log.debug(this.id+'.okDelete(modal:'+modal+')');

    var url=modal.url;
    //var panelCell=modal.sourcePanel;
    var isLocal=modal.isLocal;
    var li=modal.li;

    //ISPACES.log.alert('panelCell = '+panelCell);
    //ISPACES.log.debug('url = "'+url+'"');
    //ISPACES.log.debug('isLocal = '+isLocal);
    //ISPACES.log.debug('li = '+li);

    /*
    var callback={
      '_this':this
      ,'fn':"deleted"
      ,'params':{
        'url':url
        //,root:this.tr.root
      }
    };
    new ISPACES.Ajax(contextUrl+'/del/'+url,callback).doGet();
    */

    if(isLocal){ // deleting a local file

      var deleted=ISPACES.files.deleteFile(url);
      //ISPACES.log.debug('deleted = '+deleted);

      this.deleted(

        deleted?1:0

        ,{
          li:li
        }

      );

    }else{ // deleting a remote file

      /*
      new ISPACES.Ajax(

        new ISPACES.StringBuilder([
          contextUrl
          ,'/del/'
          ,url
        ]).asString()

        //,this.deleted.bind(this)
        ,this.deleted.bind(
          this
          ,{
            li:li
          }
        )

      ).doGet();
      */
      new ISPACES.Ajax(

        new ISPACES.StringBuilder([
          contextUrl
          ,'/del/'
          ,url
        ]).asString()

        ,{
          '_this':this
          ,'fn':"deleted"
          ,'params':{
            'url':url
            ,'li':li
          }
        }

      ).doGet();

    }

    this.hideModal();
  }

  ,deleted:function(
    r   // the response
    ,o  // the object passed through the callback
  ){
    ISPACES.log.debug(this.id+'.deleted(r:'+r+', o:'+o+')');

    var url=o.url
      //,li=o.li
      ,li=o.li.parentUl.li
    ;

    //ISPACES.log.debug('url = '+url);
    //ISPACES.log.debug('li = '+li);

    var dataUrl;
    var sound;

    if(parseInt(r)){
      sound="recycle";
      this.refreshLi(li);
    }else{
      sound="access-denied";
    }
    //_this.hideModal();

    ISPACES.sounds.play(sound);
  }


  /*
   * New Folder Modal
   */

  ,newFolder:function(e){
    ISPACES.log.debug(this.id+'.newFolder('+e+')');

    Common.killEvent(e); // WE have to kill the event, otherwise it closes the modal

    var panelCell=this.panelCell;
    var li;
    if(panelCell){ // is there a panelCell selected
      li=panelCell.li;
      if(!li){
        var toProtocol=panelCell.protocol; // check for a panelCell selected
        //ISPACES.log.debug('toProtocol = "'+toProtocol+'"');
        if(!toProtocol){
          this.error(ISPACES.getString('Please select a destination'));
          return;
        }
      }
    }else{
      this.error(ISPACES.getString('Please select a destination'));
      return;
    }

    //ISPACES.log.debug('panelCell = '+panelCell);
    //ISPACES.log.debug('li = '+li);

    var modal=this.newFolderModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    /*
     * Cover the app and set the escape mechanism.
     * Covering the app creates the greyout layer.
     * We call resizableWindow.cover() before resizableWindow.addCenteringTable() so the z-index of the centering table can be greater than the greyout.
     */
    resizableWindow.cover('0.5','#42a1d9');

    //this.escape=function(){resizableWindow.uncover()}; // Set the escape route. Set the escape function for the global escape catcher.
    //ISPACES.global.escapeKeyObject=this; // Allow the user to escape KEY out of newFolder modal.
    //ISPACES.global.escapeObject=this; // Allow the user to escape out of newFolder modal.

    if(!modal){ // If the modal has not been created before, create it.
      modal=this.newFolderModal=this.createNewFolderModal();
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      //Common.stopEvent(e);
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
      return false;
    }; // Set the escape route. Set the escape function for the global escape catcher.
    ISPACES.global.escapeKeyObject=modal; // Allow the user to escape out of copy modal.
    ISPACES.global.escapeObject=modal; // Allow the user to escape out of copy modal.

    /*
     * show the modal
     */
    modal.show();
    centeringTable.show();
    ISPACES.ui.placeCursor(modal.input); // place the cursor in the input box

    modal.on=true;
    this.modal=modal;
  }

  ,createNewFolderModal:function(){
    ISPACES.log.debug(this.id+'.createNewFolderModal()');

    var create=this.create
    ,modal=this.createModal()
    ,divNewFolder=create.div(create.txt(ISPACES.getString('New Folder'))).setClass('txt')
    //,divFrom=create.div().setClass('from-file')
    ;

    //modal.divFrom=divFrom;

    /*
     * The input element.
     */
    var input=ISPACES.ui.createInput(Constants.Properties.TEXT,Constants.Attributes.NAME,this.constants.EMPTY)
    ,inputDiv=create.div(input).setClass('input')

    ,divCreate=create.div(create.txt(ISPACES.getString('Create'))).setClass('button')
    ,cellCreate=create.divCell(divCreate).setClass('button-cell')
    ,rowCreate=create.divRow(cellCreate)
    ,divTable=create.divTable(rowCreate).setClass('buttons')

    ,innerDiv=create.div([
      divNewFolder
      ,inputDiv
      ,divTable
    ]).setClass('inner');

    ;

    modal.add(innerDiv);

    modal.createCell=cellCreate;
    modal.input=input;

    input.setClass('input');
    input.miWi(150);
    input.wip(100);
    input.addListener(
      this.constants.MOUSEDOWN
      ,function(e){Common.stopEvent(e)}
    );
    //input.md(function(e){Common.stopDefaultEvent(e)});
    //input.oc(function(e){Common.stopDefaultEvent(e)});
    input.addListener(
      this.constants.CLICK
      ,function(e){Common.stopEvent(e)}
    );

    /*
    input.onfocus=function(){this.setClass(Constants.Strings.ON)};
    input.oc(function(e){
      if(
        !this.value
        ||
        this.value&&this.value=='folder name'
      ){
        this.value=this.constants.EMPTY;
      }
      Common.stopEvent(e)
    });
    //input.wip(100);
    input.fW(Constants.Properties.BOLD);
    */
    //if(this.centeringTable)this.centeringTable.input=input;


    var okCreateFolder=this.okCreateFolder.bind(this,input);
    divCreate.enterKeyFunction=okCreateFolder;
    divCreate.addListener(this.constants.CLICK,okCreateFolder);

    modal.escapeKey=this.hideModal.bind(this);
    modal.enterKey=okCreateFolder;

    var _this=this;
    modal.addListener(
      Constants.Events.KEYDOWN
      ,modal.keyEvent=function(e){
        ISPACES.log.debug('modal.keyEvent('+(e.which||e.keyCode)+')');
        //ISPACES.log.debug('modal = '+modal);
        var key=e.which||e.keyCode;
        switch(key){
          case 13: // ISPACES.log.debug('Return/Enter');
            _this.okCreateFolder(input,e);
            Common.killEvent(e); // prevent the event from propogating and dong another okCreateFolder()
        }
      }
    );

    return modal;
  }

  ,okCreateFolder:function(input){
    ISPACES.log.debug(this.id+'.okCreateFolder(input:'+input+')');

    var name=input.value;
    //ISPACES.log.debug('name = '+name);

    var panelCell=this.panelCell
    ,panelId=panelCell.id
    ,isLocal=panelCell.isLocal
    ,url=panelCell.url
    ,li=panelCell.li
    ;

    //ISPACES.log.debug('panelCell = '+panelCell);
    //ISPACES.log.debug('panelId = '+panelId);
    //ISPACES.log.debug('isLocal = '+isLocal);
    //ISPACES.log.debug('url = '+url);
    //ISPACES.log.debug('li = '+li);

    var sb=new ISPACES.StringBuilder();

    if(!li){ // if there is no file/folder selected

      var protocol=panelCell.protocol; // check for a panelCell selected
      //ISPACES.log.debug('protocol = "'+protocol+'"');

      if(protocol){

        sb.appendAll([
          protocol
          ,':/'
        ]);

      }

    }else{

      var url=li.url;
      var isDir=li.isDir;
      //ISPACES.log.debug('url = "'+url+'"');
      //ISPACES.log.debug('isDir = '+isDir);

      if(isDir){
        sb.appendAll([
          url
          ,this.constants.FSLASH
        ]);
      }else{ // Get the parent directory name from the fileName
        var i=url.lastIndexOf(this.constants.FSLASH);
        sb.append(url.substring(0,i+1));
      }

    }

    sb.append(name);
    var folderUrl=sb.asString();
    //ISPACES.log.debug('folderUrl = "'+folderUrl+'"');

    /*
    var sb=new ISPACES.StringBuilder();
    sb.append(currentUrl);
    if(!currentUrl.endsWithChar(this.constants.FSLASH))sb.append(this.FSLASH);
    sb.append(name);
    var fileUrl=sb.asString();
    ISPACES.log.debug('fileUrl = '+fileUrl);
    */

    var callbackObject={
      'url':folderUrl
      ,'li':li
    };

    //if(this.leftRight.isLocal){ // Creating a local folder.
    if(isLocal){ // Creating a local folder.

      var created=ISPACES.files.newFolder(folderUrl);
      //ISPACES.log.debug('created = '+created);

      //if(created)this.folderCreated();

      this.folderCreated(
        created?1:0
        /*
        ,{
          'url':folderUrl
          ,'li':li
        }
        */
        ,callbackObject
      );

    }else{ // Creating a remote folder.

      new ISPACES.Ajax(

        new ISPACES.StringBuilder([
          contextUrl
          ,'/mkdir/'
          ,folderUrl
        ]).asString()

        ,{
          '_this':this
          ,'fn':"folderCreated"
          /*
          ,'params':{
            'url':folderUrl
            ,'li':li
          }
          */
          ,'params':callbackObject
        }

      ).doGet();

    }

    this.hideModal();
  }

  ,folderCreated:function(r,o){
    ISPACES.log.debug(this.id+'.folderCreated(r:'+r+', o:'+o+')');

    var url=o.url
    ,li=o.li
    ;

    //ISPACES.log.debug('url = '+url);
    //ISPACES.log.debug('li = '+li);

    var sound;

    if(parseInt(r)){
      sound="email";
      //this.refresh();
      //this.refreshUrl(url);
      this.refreshLi(li);
    }else{
      sound="access-denied";
    }

    //_this.hideModal();
    ISPACES.sounds.play(sound);

    /*
    var protocolAndPath=o.url.split(this.constants.COLON);
    var protocol=protocolAndPath[0];
    var path=protocolAndPath[1];
    var parentNameAndPath=this.getParentNameAndPath(path);

    if(parseInt(r)){
      var fileMap=ISPACES.files.create(protocol,path,0);
      var fileUl=this.createFileUl(this.root,parentNameAndPath[1],fileMap,this.fileDiv); // Create the new file table.
      this.fileDiv.replaceFirst(fileUl); // Replace the old file table with the new one.
      this.trMouseDown(null,fileUl.fC(),this.fileDiv); // Simulate the mouse down on the first row, to select it.
      //this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
    }
    */
  }


  /*
   * Authenticate Modal
   */

  ,authenticate:function(
    protocol
    ,url
  ){
    ISPACES.log.debug(this.id+'.authenticate(protocol:"'+protocol+'", url:"'+url+'")');

    var modal=this.authModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    /*
     * Cover the app and set the escape mechanism.
     * Covering the app creates the greyout layer.
     * We call resizableWindow.cover() before resizableWindow.addCenteringTable() so the z-index of the centering table can be greater than the greyout.
     */
    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){ // If the modal has not been created before, create it.
      modal=this.authModal=this.createAuthModal(url);
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    /*
    var message=new ISPACES.StringBuilder([
      'You need to log in to your '
      ,protocol
      ,' account to access your files.'
    ]).asString();
    modal.textDiv.replaceFirst(this.create.txt(message));
    */

    modal.protocol=protocol;
    modal.url=url;

    ISPACES.log.debug('modal.show()');
    modal.show();
    ISPACES.log.debug('centeringTable.show()');
    centeringTable.show();

    modal.on=true;
    this.modal=modal;

    /*
    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      ISPACES.global.escapeKeyObject=null; // Reset the global escape key object to null.
      ISPACES.global.escapeObject=null; // Reset the global escape object to null.
      //Common.stopEvent(e);
      return false;
    }; // Set the escape route. Set the escape function for the global escape catcher.

    ISPACES.global.escapeKeyObject=modal; // Allow the user to escape out of copy modal.
    ISPACES.global.escapeObject=modal; // Allow the user to escape out of copy modal.
    */

    new ISPACES.AsyncApply(
      this
      ,"setModalEscape"
      ,[
        modal
        ,resizableWindow
      ]
      ,100
    );

  }

  ,createAuthModal:function(url){
    ISPACES.log.debug(this.id+'.createAuthModal(url:'+url+')');

    /*
     * DOM
     */
    var create=this.create
    ,modal=this.createModal()

    ,divFirst=create.div(create.txt(ISPACES.getString('First'))).setClass('txt')
    ,divThen=create.div(create.txt('...'+ISPACES.getString('then'))).setClass('txt')

    ,divAuth=create.div(create.txt(ISPACES.getString('Authenticate'))).setClass('button')
    ,cellAuth=create.divCell(divAuth).setClass('button-cell')
    ,rowAuth=create.divRow(cellAuth)

    ,divContinue=create.div(create.txt(ISPACES.getString('Continue'))).setClass('button')
    ,cellContinue=create.divCell(divContinue).setClass('button-cell')
    ,rowContinue=create.divRow(cellContinue)

    ,divTable=create.divTable([
      divFirst
      ,rowAuth
      ,divThen
      ,rowContinue
    ]).setClass('inner')

    ;

    modal.add(divTable);

    /*
     * Events
     */
    divAuth.addListener(
      this.constants.CLICK
      ,this.okAuth.bind(this,modal)
    );

    divContinue.addListener(
      this.constants.CLICK
      ,this.serviceAuthorized.bind(this,modal)
    );

    modal.escapeKey=this.hideModal.bind(this);

    modal.enterKey=this.okAuth.bind(this,url);

    return modal;
  }

  ,serviceAuthorized:function(modal){
    ISPACES.log.debug(this.id+'.serviceAuthorized(modal:"'+modal+'")');

    var _this=this;
    var protocol=modal.protocol;
    ISPACES.log.debug('protocol = '+protocol);

    new ISPACES.Ajax(

      contextUrl+'/ServiceAuthorized'

      ,function(r){
        ISPACES.log.debug('serviceAuthorized(protocol:"'+protocol+'"): callback('+r+')');

        var authorized=eval(Common.parens(r));
        ISPACES.log.debug('authorized = '+authorized);

        if(authorized){

          var panelCell=_this.panelCell;
          ISPACES.log.debug('panelCell = '+panelCell);

          _this.addTree({
            panelCell:panelCell
            ,protocol:protocol
            ,fileDiv:panelCell.fileDiv
            ,isLocal:panelCell.isLocal
            //,refresh:true
          });
        }

        _this.hideModal(); // Temporary - hiding the modal before the tree has been received.
      }

    ).doGet();

  }

  /*
   * http://stackoverflow.com/questions/4964130/target-blank-vs-target-new
   * http://www.w3schools.com/jsref/met_win_open.asp
   */
  ,okAuth:function(
    modal
    ,e
  ){
    ISPACES.log.debug(this.id+'.okAuth(modal:'+modal+', e:"'+e+'")');

    Common.stopEvent(e); // There is an onclick handler in the resizableWindow.centeringTable to close it. Prevent the event from propogating there.

    ISPACES.log.debug('modal.url = '+modal.url);

    var newWindow=window.open(
      modal.url
      ,'_blank'
    );

    //var newWindow=window.open('http://www.irishdictionary.ie','_blank'); // for development
    newWindow.focus();
  }


  /*
   * Error Modal
   */

  ,error:function(x){
    ISPACES.log.debug(this.id+'.error(x:'+x+'")');

    var modal=this.errorModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){ // If the modal has not been created before, create it.
      modal=this.errorModal=this.createErrorModal();
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    var messageDiv=modal.messageDiv;
    messageDiv.replaceFirst(this.create.txt(x));

    /*
     * show the modal
     */
    modal.show();
    centeringTable.show();

    /*
     * Set a flag and set the modal as a property of the app.
     */
    modal.on=true;
    this.modal=modal;

    /*
     * Set the escape route. Set the escape function for the global escape catcher.
     */
    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
    };
    ISPACES.global.escapeKeyObject=modal;
    ISPACES.global.escapeObject=modal;
  }

  ,createErrorModal:function(){
    ISPACES.log.debug(this.id+'.createErrorModal()');

    var create=this.create
    ,modal=this.createModal()
    ;

    var messageDiv=create.div(create.txt(ISPACES.getString('Message'))).setClass('message');

    var divOk=create.div(create.txt(ISPACES.getString('OK'))).setClass('button')
    ,cellOk=create.divCell(divOk).setClass('button-cell')
    ,rowOk=create.divRow(cellOk)
    ;

    var divTable=create.divTable([
      rowOk
    ]).setClass('buttons');

    var innerDiv=create.div([
      messageDiv
      ,divTable
    ]).setClass('inner');

    modal.add(innerDiv);
    modal.messageDiv=messageDiv;

    divOk.addListener(
      this.constants.CLICK
      ,this.ok.bind(this,modal)
    );

    modal.escapeKey=this.hideModal.bind(this);

    modal.enterKey=this.ok.bind(this,modal);

    return modal;
  }

  /*
   * Local Roots Modal
   */

  /* dev
  ,addLocalRoots:function(e){
    //ISPACES.log.debug(this.id+'.addLocalRoots('+e+')');
    var json="['',{'/':'harddrive'}]"; // Temporary - Mac, Linux, UNIX
    ISPACES.setLocalRoots(json,this.id);
  }
  */

  ,addLocalRoots:function(e){
    ISPACES.log.debug(this.id+'.addLocalRoots('+e+')');

    //ISPACES.files.addLocalRoots(this.id);
    new ISPACES.AsyncApply(
      ISPACES.files
      ,"addLocalRoots"
      ,[this.id]
      ,1
    );

    Common.stopEvent(e);

    var modal=this.appletModal
    ,resizableWindow=this.resizableWindow
    ,centeringTable=resizableWindow.centeringTable
    ;

    /*
     * Cover the app and set the escape mechanism.
     * Covering the app creates the greyout layer.
     * We call resizableWindow.cover() before resizableWindow.addCenteringTable() so the z-index of the centering table can be greater than the greyout.
     */
    resizableWindow.cover('0.5','#42a1d9');

    if(!modal){ // If the modal has not been created before, create it.
      modal=this.appletModal=this.createAppletModal();
      if(!centeringTable)centeringTable=resizableWindow.addCenteringTable();
      centeringTable.td.add(modal);
    }

    //modal.textDiv.replaceFirst(this.create.txt('Accessing Local File System...'));
    //modal.textDiv.replaceFirst(this.create.txt(ISPACES.getString("Accessing the Local File System. Please wait...")));
    modal.textDiv.replaceFirst(this.create.txt(ISPACES.getString('Accessing the Local File System. Please wait...')));

    modal.show();
    centeringTable.show();

    /*
     * Set the escape route. Set the escape function for the global escape catcher.
     */
    //var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      this.hide();
    //  //_this.cancel();
    //  //Common.stopEvent(e);
    //  //return false;
    };
    ISPACES.global.escapeKeyObject=modal; // escape key
    ISPACES.global.escapeObject=modal; // mouse click

    modal.on=true;
    this.modal=modal;

    //ISPACES.files.addLocalRoots(this.id);
    //new ISPACES.AsyncApply(ISPACES.files,"addLocalRoots",null,1);
  }

  ,createAppletModal:function(){
    //ISPACES.log.debug(this.id+'.createAppletModal()');

    var _this=this;

    var modal=this.createModal();

    //var textDiv=this.create.div().setClass('from-file');
    var textDiv=this.create.div().setClass('from-file').setClass('message');
    //textDiv.pa('20px');
    modal.textDiv=textDiv;
    modal.add(textDiv);

    return modal;
  }


  /*
   * Context Menus
   */

  ,createContextMenus:function(){
    //ISPACES.log.debug(this.id+'.createContextMenus()');

    var _this=this;
    var IMAGES=Constants.Paths.IMAGES;

    var newFolderContextMenuJson=[
      {
        tx:'New Folder'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.newFolderInline(e)}
        ,oc:this.newFolder.bind(this)
      }
      ,{
        tx:'Close Panel'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.newFolderInline(e)}
        //,oc:this.closePanel.bind(this,this.panelCell)
        ,oc:this.closePanel.bind(this,this.panelCell)
      }
    ];

    this.newFolderContextMenu=new ISPACES.ContextMenu(this,newFolderContextMenuJson);

    //this.createContextMenu();
  //}

  //,createContextMenu:function(){
    //ISPACES.log.debug(this.id+'.createContextMenu()');

    //var _this=this;
    //var IMAGES=Constants.Paths.IMAGES;

    var fileContextMenuJson=[
      {
        tx:'Open'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.open(e)} // The "e" here is replaced by the event that launched the context menu so we can capture intended source of the event.
        ,oc:this.open.bind(this)
      }
      /*
      ,{
        tx:'Play'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.rename(e);Common.stopEvent(e);Common.stopDefaultEvent(e);return false;}
        //,oc:function(e){_this.rename(e)}
        ,oc:this.play.bind(this)
        //,oc:function(e){_this.rename(e)}
      }
      */
      ,{
        tx:'Rename'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.rename(e);Common.stopEvent(e);Common.stopDefaultEvent(e);return false;}
        //,oc:function(e){_this.rename(e)}
        ,oc:this.rename.bind(this)
      }
      ,{
        tx:'Delete'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.del(e)}
        ,oc:this.del.bind(this)
      }
      ,{
        tx:'New Folder'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.newFolderInline(e)}
        ,oc:this.newFolder.bind(this)
      }
    ];

    this.fileContextMenu=new ISPACES.ContextMenu(this,fileContextMenuJson);
    //this.contextMenu=new ContextMenu(this,this.contextMenuJson);
    /*
    var _this=this;
    if(Constants.isOpera){ // Opera does not support the right click. We can use the left click plus CTRL key.
      this.desktop.oc(function(e){if(e.ctrlKey){_this.showContextMenu(e);Common.stopEvent(e);return false}});
    }else{
      this.desktop.cm(function(e){_this.showContextMenu(e);Common.stopEvent(e);return false});
    }
    */
  }

  ,showContextMenu:function(e){
    ISPACES.log.debug(this.id+'.showContextMenu('+e+')');
    this.fileContextMenu.show(e);
    Common.killEvent(e);
    return false;
  }

  ,showPanelContextMenu:function(e){
    ISPACES.log.debug(this.id+'.showPanelContextMenu('+e+')');
    this.newFolderContextMenu.show(e);
    Common.killEvent(e);
    return false;
  }

  ,open:function(e){
    ISPACES.log.debug(this.id+'.open('+e+')');

    //ISPACES.log.debug('e.currentTarget = '+e.currentTarget);
    //ISPACES.log.debug('e.targetElement = '+e.targetElement);
    //ISPACES.log.debug('e[\'target\'] = '+e['target']);

    //ISPACES.log.debug('e.fileName = '+e.fileName);
    //ISPACES.log.debug('e.url = '+e.url);
    //var tr=e.o,fileName=e.o.fileName,url=e.o.url;
    //ISPACES.log.debug('fileName = "'+fileName+'", url = "'+url+'"');

    //ISPACES.log.debug(this.id+'.open(e): e.targetElement = '+e.targetElement);
    //ISPACES.log.debug(this.id+'.open(e): e["target"] = '+e['target']);
    //e['target'].app.destroy();
    //ISPACES.applications.launchFileName(e.url);
    //ISPACES.applications.launchFileName(e.o,e);

    //ISPACES.applications.launchFileName(e.o,e);
    //ISPACES.applications.launchFileName(e.currentTarget,e);
    ISPACES.applications.launchFileName(e.targetElement,e);
  }

  /*
  ,play:function(e){
    ISPACES.log.debug(this.id+'.play('+e+')');

    //ISPACES.log.debug('e.currentTarget = '+e.currentTarget);
    //ISPACES.log.debug('e.targetElement = '+e.targetElement);
    //ISPACES.log.debug('e[\'target\'] = '+e['target']);

    var el=e.targetElement;
    ISPACES.log.debug('el = '+el);
    var url=el.url;
    ISPACES.log.debug('url = '+url);

    ISPACES.sounds.playUrl(url);
  }
  */

  /*
   * Inline Rename
   */

  /*
   * @param e the event from the right click
   * TextNode.textContent - Sets or returns the text content of an element including the text content of its descendants.
   * TextNode.data - Sets or returns the text content of a CommentNode, TextNode or comment element.
   * http://help.dottoro.com/ljkuedch.php
   */
  ,rename:function(e){
    ISPACES.log.debug(this.id+'.rename('+e+')');

    var _this=this // _this.restoreFileName
    ,li=e.targetElement
    ,isLocal=li.isLocal
    ,div=li.div
    ,textNode=div.firstChild
    ,FSLASH=this.constants.FSLASH
    ,fileName=li.fileName
    ,length=fileName.length
    ,fromUrl=li.url;
    ;

    //ISPACES.log.debug('li = '+li);
    //ISPACES.log.debug('isLocal = '+isLocal);
    //ISPACES.log.debug('div = '+div);
    //ISPACES.log.debug('textNode = '+textNode);
    //ISPACES.log.debug('fileName = '+fileName);
    //ISPACES.log.debug('length = '+length);
    //ISPACES.log.debug('fromUrl = '+fromUrl);

    this.removeKeyListeners();

    div.setClass('outline');

    //div.contentEditable=true; // 'contentEditable' is getting obfuscated
    div['contentEditable']=true;
    //div.sA('contenteditable','true');

    // turn off spellcheck
    //div.spellcheck=false;
    //div.sA('spellcheck','false');
    //ISPACES.log.debug('(\'spellcheck\' in body) = '+('spellcheck' in body));
    //body.sA('spellcheck','false');
    if('spellcheck' in body){
      body.spellcheck=false;
    }

    div.addListener(

      Constants.Events.KEYDOWN

      ,div.keyDown=function(e){
        ISPACES.log.debug('div.keyDown('+(e.which||e.keyCode)+')');

        //e.preventDefault();

        var key=e.which||e.keyCode;
        //ISPACES.log.debug('key = '+key);

        switch(key){

          case 8: ISPACES.log.debug('DELETE');

            if(Constants.isChrome){ // Special handler from Chrome which wants to return to the previous page when hitting the delete key.

              document.execCommand('delete',false,null);

              e.preventDefault();

              this.focus();

              var range=document.createRange(); // Create a range (a range is a like the selection but invisible).
              range.selectNodeContents(textNode);
              range.collapse(false);
              var sel=window.getSelection();
              sel['removeAllRanges']();
              sel.addRange(range);

              //e.stopPropagation();
              //e.cancelBubble=true;
              //e.returnValue=false;
              //e.preventDefault();

              /*
              var newName=textNode.data;
              ISPACES.log.debug('newName  = "'+newName+'"');
              var newLength=newName.length;
              ISPACES.log.debug('newLength  = '+newLength);

              //this.focus();
              //this['contentEditable']=true;
              //div['contentEditable']=true;
              //div.focus();

              var range=document.createRange();
              range.selectNodeContents(textNode); // Select the entire contents of the element with the range
              //range.collapse(false); // Collapse the range to the end point. false means collapse to end rather than the start
              var selection=window.getSelection(); // Get the selection object (allows you to change selection)
              selection.addRange(range); // Make the range you have just created the visible selection.
              //selection.collapse(textNode,length);
              selection.collapse(textNode,newLength);
              //selection.collapse(textNode,(newLength-1));
              selection.collapseToEnd();

              div.focus();

              //*/
              //ISPACES.log.debug('div.keyEvent('+e+'): return false;');
              //return false;
              //ISPACES.log.debug('div.keyEvent('+e+'): return true;');
              //return true;

            }
            break;

          case 13: // ISPACES.log.debug('RETURN/ENTER');

            var newName=textNode.data;

            //ISPACES.log.debug('fileName = "'+fileName+'"');
            //ISPACES.log.debug('newName  = "'+newName+'"');

            if(newName!=fileName){ // only update if the fileName has changed

              var lastIndexOfFileSeparator=fromUrl.lastIndexOf(FSLASH);
              var path=fromUrl.substring(0,lastIndexOfFileSeparator+1);
              var toUrl=new ISPACES.StringBuilder([path,newName]).asString();

              //ISPACES.log.debug('lastIndexOfFileSeparator = '+lastIndexOfFileSeparator);
              //ISPACES.log.debug('path = '+path);
              //ISPACES.log.debug('toUrl = '+toUrl);

              if(isLocal){

                //var renamed=ISPACES.files.renameFile({f:fromUrl,t:toUrl});
                //var renamed=ISPACES.files.renameFile(fromUrl,toUrl);
                var renamed=ISPACES.files.renameFile(
                  fromUrl
                  ,toUrl
                );

                //ISPACES.log.debug('renamed = '+renamed);

                if(renamed){ // The rename was successful.

                  li.fileName=newName;
                  li.url=toUrl;
                  li.div.url=toUrl;

                  var from=[
                    fileName
                    ,fromUrl
                  ];

                  var to=[
                    newName
                    ,toUrl
                  ];

                  //ISPACES.files.rename(from,to); // not required for local files.

                  div.setClass('selected');
                  div['contentEditable']=false;
                  div.removeListener(Constants.Events.KEYDOWN,this.keyDown);
                  div.blur();
                  body.spellcheck=true; // Re-enable the spellcheck.

                }else{ // if(renamed)

                  _this.restoreFileNameDiv(div,fileName);

                  div.removeListener(
                    Constants.Events.KEYDOWN
                    ,div.keyDown
                  );

                  div.setClass('selected');
                  div['contentEditable']=false;
                  div.removeListener(Constants.Events.KEYDOWN,this.keyDown);
                  div.blur();
                  body.spellcheck=true; // Re-enable the spellcheck.
                }

              }else{

                new ISPACES.Ajax(
                  contextUrl+"/move"
                  ,function(r){
                    ISPACES.log.debug('callback("'+r+'")');

                    if(parseInt(r)){ // The rename was successful.

                      //_this.restoreFileNameDiv(el,newName);
                      li.fileName=newName;
                      li.url=toUrl;

                      //ISPACES.log.debug('li.fileName="'+li.fileName+'"');
                      //ISPACES.log.debug('li.url="'+li.url+'"');
                      //ISPACES.log.debug('el.fileStem="'+el.fileStem+'"');

                      //el.textCell.replaceFirst(this.create.txt(newName));
                      //textCell.replaceFirst(this.create.txt(newName));

                      //var fileMap=ISPACES.files.rename(fromUrl,toUrl);

                      var from=[
                        fileName
                        ,fromUrl
                      ];

                      var to=[
                        newName
                        ,toUrl
                      ];

                      //var fileMap=ISPACES.files.rename(from,to);
                      ISPACES.files.rename(from,to);

                      //var fileUl=this.createFileUl(tr.root,parentNameAndPath[1],fileMap,this.fileDiv); // Create the new file table.
                      //this.fileDiv.replaceFirst(fileUl); // Replace the old file table with the new one.
                      //this.trMouseDown(null,fileUl.fC(),this.fileDiv); // Simulate the mouse down on the first row, to select it.
                      ////this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.

                      //_this.restoreFileNameDiv(el,el.fileName);

                      // TBD. If the file being renamed is on the desktop, we have to change it there too.
                      //ISPACES.spaces.space.desktop.files[newName]=ISPACES.spaces.space.desktop.files[fileName];
                      //delete ISPACES.spaces.space.desktop.files[fileName];
                      //var filesString=JSON.stringify(ISPACES.spaces.space.desktop.files);
                      ////ISPACES.log.alert(ISPACES.spaces.space.desktop.id+'.rename("'+e+'"): filesString = '+filesString);
                      //var sb=new ISPACES.StringBuilder();
                      //sb.appendAll(["this.resetPositions(",filesString,RIGHTPAREN]);
                      ////ISPACES.log.alert('tr.draggableElement.moved('+xy+'): sb.asString() = '+sb.asString());
                      ////ISPACES.log.alert('tr.draggableElement.moved('+xy+'): ISPACES.spaces.space.store.reset('+_this.id+','+sb.asString()+')');
                      //ISPACES.spaces.space.store.reset(ISPACES.spaces.space.desktop.id,sb.asString());

                      div.removeListener(
                        Constants.Events.KEYDOWN
                        ,div.keyDown
                      );

                      div.setClass('selected');
                      div['contentEditable']=false;
                      div.removeListener(Constants.Events.KEYDOWN,this.keyDown);
                      div.blur();
                      body.spellcheck=true; // Re-enable the spellcheck.

                      ISPACES.log.warn(this.id+'.rename('+e+'): We should only refresh the current desktop, and refresh other desktops when they are re-accessed.');
                      ISPACES.spaces.space.desktop.refresh(); // Do we need the refresh the current desktop?

                      ISPACES.log.warn(this.id+'.rename('+e+'): If a file manager has folder open that is modified by the rename, we have to update that FileManager.');
                      var fileManagers=ISPACES.system.getAps(_this.classId);
                      //ISPACES.log.debug('fileManagers = '+fileManagers);
                      //ISPACES.log.debug('fileManagers.length = '+fileManagers.length);
                      //fileManagers.forEach(function(x){if(x!=fileManager)x.recreateRoots()});
                      fileManagers.forEach(function(fileManager){fileManager.refresh()});

                    } // if(parseInt(r))
                  } // callback

                //); // new ISPACES.Ajax()
                ).send({f:fromUrl,t:toUrl}); // new ISPACES.Ajax()
                //}).send({f:fromUrl,t:toUrl,'millis':Common.millis()}); // new ISPACES.Ajax()

              } // if(isLocal)

            }else{ // if(newName!=fileName)

              div.removeListener(
                Constants.Events.KEYDOWN
                ,div.keyDown
              );

              this.setClass('selected');
              this['contentEditable']=false;
              this.removeListener(Constants.Events.KEYDOWN,this.keyDown);
              this.blur();
              //el.oc(el.onClick); // Remove the on click event while the file is being renamed.
              body.spellcheck=true; // Re-enable the spellcheck.

            } // if(newName!=fileName)

            ISPACES.global.escapeKeyObject=null;
            ISPACES.global.escapeObject=null;

            _this.addKeyListeners(); // Re-add the key listeners after renaming.
            //*/

            //Common.stopDefaultEvent(e); // Prevent the return/enter key from taking the input to the next line.
            Common.killEvent(e); // Prevent the return/enter key from propogating to the next level.

            break;
            //return true;

          case 27: // ISPACES.log.debug('ESCAPE');

            //ISPACES.log.debug('fileName = '+fileName);

            div.removeListener(
              Constants.Events.KEYDOWN
              ,div.keyDown
            );

            //this.setClass('');
            this.setClass('selected');
            this['contentEditable']=false;
            //this.sA('contenteditable','false');
            this.removeListener(Constants.Events.KEYDOWN,this.keyDown);
            this.blur();
            //el.oc(el.onClick); // Remove the on click event while the file is being renamed.
            ISPACES.global.escapeKeyObject=null;
            ISPACES.global.escapeObject=null;

            //this.replaceFirst(this.create.txt(fileName));
            //this.replaceFirst(_this.create.txt('test'));
            //textNode.data='test';
            //new ISPACES.AsyncApply(_this,"restoreFileName",[textNode,fileName],10);
            //new ISPACES.AsyncApply(_this,"restoreFileNameDiv",[el,fileName],1000);
            //_this.restoreFileNameDiv(el,fileName);
            _this.restoreFileNameDiv(div,fileName);

            _this.addKeyListeners(); // Re-add the key listeners after renaming.

            //default:
            //return;

        } // switch(key)

        //ISPACES.log.debug('div.keyDown('+e+'): return true;');
        //return true;
        //ISPACES.log.debug('div.keyDown('+e+'): return false;');
        return false;
      }

      ,false
    );

    div.focus();

    var range=document.createRange(); // Create a range (a range is a like the selection but invisible).
    //ISPACES.log.debug('range = ');
    //ISPACES.log.object(range);

    //range.selectNode(el);
    //range.selectNode(div);
    //range.selectNode(el.fC());
    //range.selectNodeContents(el); // Select the entire contents of the element with the range
    //range.selectNodeContents(div); // Select the entire contents of the element with the range
    range.selectNodeContents(textNode); // Select the entire contents of the element with the range
    //range.collapse(false); // Collapse the range to the end point. false means collapse to end rather than the start

    //*
    var selection=window.getSelection(); // Get the selection object (allows you to change selection)
    //ISPACES.log.debug('selection = ');
    //ISPACES.log.object(selection);

    //range.setStart(textNode,10);
    //range.setEnd(textNode,10);
    //range.setStart(textNode,length);
    //range.setEnd(textNode,length);
    //range.setStart(el,length);
    //range.setEnd(el,length);
    //selection.addRange(range);
    //selection.collapse();
    //range.collapse(false);

    //selection['removeAllRanges'](); // Remove any selections already made.
    selection.addRange(range); // Make the range you have just created the visible selection.

    // selection.collapse(content.childsNode[4], 23);// put the caret at fifth node, offset 23 characters
    selection.collapse(textNode,length);
    //selection.collapse(textNode,10);
    //selection.collapseToStart();
    //selection.collapseToEnd();
    //*/

    //el.focus();
    //el.click();

    //el.escape=function(){
      //ISPACES.log.debug('el.escape()');
    div.escape=function(){
      ISPACES.log.debug('div.escape()');
      //ISPACES.log.debug('fileName = '+fileName);

      /*
      //this.replaceFirst(this.create.txt(fileName));
      _this.restoreFileNameDiv(this,fileName);
      */
      //this.setClass('');
      this.setClass('selected');
      this['contentEditable']=false;
      //this.sA('contenteditable','false');
      this.removeListener(Constants.Events.KEYDOWN,this.keyDown);
      this.blur();

      _this.restoreFileNameDiv(div,fileName);

      ISPACES.global.escapeKeyObject=null;
      ISPACES.global.escapeObject=null;
    };

    ISPACES.global.escapeKeyObject=div;
    ISPACES.global.escapeObject=div;

    //el.selectionStart=10;
    //el.selectionEnd=10;
    //var textRange=body.createTextRange();
    //ISPACES.log.object(textRange);
    //textRange.moveToElementText(el);
    //range.setEndPoint('EndToStart',textRange);
    //range.selectNodeContents(el);
    //range.setStart('character',0);
    //range.setEnd('character',10);
    //range.setStart(range.END_TO_START);
    //range.setStartAfter();
    /*
    var sel=this.getSelection(el);
    ISPACES.log.debug('sel = '+sel);
    var range=sel.getRangeAt(0);
    ISPACES.log.debug('range = '+range);
    ISPACES.log.debug('Current position: '+range.startOffset+' inside '+range.startContainer);
    */
  }

  ,restoreFileNameDiv:function(div,fileName){
    ISPACES.log.debug(this.classId+'.restoreFileNameDiv('+div+', "'+fileName+'")');
    //textNode.data=fileName;
    //div.data='test';
    //var parentNode=div.parentNode;
    //div.replaceFirst(this.create.txt('test0'));
    //div.rm();
    //parentNode.rmCs();
    div.rmCs();
    //parentNode.add(this.create.txt(fileName));
    div.add(this.create.txt(fileName));
  }

  ,restoreFileName:function(textNode,fileName){
    ISPACES.log.debug(this.classId+'.restoreFileName('+textNode+', '+fileName+')');
    //textNode.data=fileName;
    textNode.data='test';
  }

  // TBD
  //,okRename:function(fromUrl,toUrl){
  //  ISPACES.log.debug(this.id+'.okRename(fromUrl:"'+fromUrl+'", toUrl:"'+toUrl+'")');
  //}

  /*
   * focus/blur
   */
  /*
  ,focus:function(){
    ISPACES.log.debug(this.id+'.focus()');

    this.addListeners();
    //this.trMouseDown(null,fileTable.tbody.fC(),this.selectedFileDiv);
    //this.trMouseDown(null,this.tr,this.selectedFileDiv);
    this.resizableWindow.focus();
  }

  ,blur:function(app){
    ISPACES.log.debug(this.id+'.blur()');

    this.removeListeners();
    if(app)this.resizableWindow.blur(app);
  }
  */

  /*
   * Keyboard Events
   */
  /*
  ,addKeyListeners:function(){
    if(!this.eventsAdded){
      ISPACES.log.debug(this.id+'.addKeyListeners()');
      var _this=this;
      //addListener(document,KEYDOWN,this.kd=function(e){_this.keyDown(e)},false);
      //addListener(document,KEYUP,this.ku=function(e){_this.keyUp(e)},false);
      this.kd=function(e){_this.keyDown(e)};
      this.ku=function(e){_this.keyUp(e)};
      Common.addListener(document,Constants.Events.KEYDOWN,this.kd,false);
      Common.addListener(document,Constants.Events.KEYUP,this.ku,false);
      this.eventsAdded=true;
    }
  }

  ,removeListeners:function(){
    ISPACES.log.debug(this.id+'.removeListeners()');
    this.removeKeyListeners();
  }

  ,removeKeyListeners:function(){
    if(this.eventsAdded){
      ISPACES.log.debug(this.id+'.removeKeyListeners()');

      Common.removeListener(document,Constants.Events.KEYDOWN,this.kd,false);
      this.kd=null;

      Common.removeListener(document,Constants.Events.KEYUP,this.ku,false);
      this.ku=null;

      //removeListener(document,Constants.Events.KEYPRESS,this.kp,false);
      //this.resizableWindow.blur(app);
      this.eventsAdded=false;
    }
  }
  */

  ,keyDown:function(e){
    ISPACES.log.debug(this.id+'.keyDown('+(e.which||e.keyCode)+')');

    var key=e.which||e.keyCode;
    //ISPACES.log.debug('key = '+key);

    /*
    if(key==115){ // F4 : Quit.
      this.destroySave(e);
      return;
    }
    */

    if(key==16)this.isShift=true;
    if(key==17)this.isCtrl=true;
    if(key==18)this.isAlt=true;

    //ISPACES.log.debug(this.id+'.keyDown(e): key = '+key+', this.isShift = '+this.isShift+', this.isCtrl = '+this.isCtrl+', this.isAlt = '+this.isAlt);

    switch(key){

      case 9: // ISPACES.log.debug('Tab');

        this.tabKey();
        Common.stopDefaultEvent(e);
        break;

      case 13: // ISPACES.log.debug('Return/Enter');

        this.enterKey(e);
        break;

      case 18: // ISPACES.log.debug('Alt');

        this.isAlt=true;
        break;

      case 27: // ISPACES.log.debug('Escape');

        this.escapeKey(e);
        break;

      case 32: // ISPACES.log.debug('Spacebar');

        this.spacebar();
        break;

      case 35: // ISPACES.log.debug('End');

        this.end();
        Common.stopDefaultEvent(e);
        return false;
        break;

      case 36: // ISPACES.log.debug('Home');

        this.home();
        Common.stopDefaultEvent(e);
        return false;
        break;

      case 37: // ISPACES.log.info('Left Arrow');

        this.leftArrow(e); // Closes a folder if a folder is selected and open in tree mode.
        //Common.stopDefaultEvent(e);
        //return false;
        break;

      case 38: // ISPACES.log.info('Up Arrow');

        this.upArrow();
        e.preventDefault(); // prevent any scroll action
        break;

      case 39: // ISPACES.log.info('Right Arrow');

        this.rightArrow(e); // Opens a folder if a folder is selected in tree mode.
        //Common.stopDefaultEvent(e);
        //return false;
        break;

      case 40: // ISPACES.log.info('Down Arrow');

        this.downArrow();
        //Common.stopDefaultEvent(e);
        e.preventDefault(); // prevent any scroll action
        //return false;
        break;

      case 46: // ISPACES.log.debug('Delete');
      case 119: // ISPACES.log.debug('F8');

        this.deleteKey(e);
        break;

      case 115:  ISPACES.log.debug('F4');

        if(this.isAlt){
          this.destroy();
          this.isAlt=false;
        }
        Common.stopDefaultEvent(e);
        break;

      case 116: // ISPACES.log.debug('F5');

        this.f5();
        //Common.stopDefaultEvent(e);
        Common.killEvent(e);
        return false;
        break;

      case 117: // ISPACES.log.debug('F6');

        if(this.isShift){
          e.o=this.tr;
          this.rename(e);
          Common.stopDefaultEvent(e);
          return false;
        }
        this.f6();
        Common.stopDefaultEvent(e);
        break;

      case 118: // ISPACES.log.debug('F7');

        this.f7();
        Common.stopDefaultEvent(e);
        break;

      default:return; // What to do for default?
    }

  }

  ,keyUp:function(e){
    //ISPACES.log.debug(this.id+'.keyUp('+e+')');

    var key=e.keyCode;
    //ISPACES.log.debug('key = '+key+', this.isAlt = '+this.isAlt+', this.isCtrl = '+this.isCtrl);

    if(key==16){
      this.isShift=false;
    }
    if(key==17){
      this.isCtrl=false;
    }
    /*
    if(key==18){
      this.isAlt=false;
    }
    */
  }

  ,enterKey:function(e){
    ISPACES.log.debug(this.id+'.enterKey('+e+')');

    if(this.modal&&this.modal.on){ // If the modal window is showing, we pass the event on to the modal.
      //ISPACES.log.debug(this.id+'.enterKey(): this.modal.on = '+this.modal.on);
      this.modal.enterKey(e);
      return;
    }
    //if(this.tr)this.trDoubleClick(this.tr);

    var panelCell=this.panelCell
    ,li=panelCell.li
    ,isDir=li.isDir
    ;

    //ISPACES.log.debug('panelCell = '+panelCell);
    //ISPACES.log.debug('li = '+li);
    //ISPACES.log.debug('isDir = '+isDir);

    if(isDir){
      this.rightArrow(e); // Opens a folder if a folder is selected in tree mode.
    }else{
      ISPACES.applications.launchFileName(li,e);
      //Common.stopDefaultEvent(e);
    }
  }

  ,upArrow:function(){
    //ISPACES.log.debug(this.id+'.upArrow()');

    var panelCell=this.panelCell;
    //ISPACES.log.debug('panelCell = '+panelCell);

    var li=panelCell.li;
    var fileDiv=panelCell.fileDiv;
    var isCtrl=this.isCtrl;

    if(li){
      //ISPACES.log.debug('li = '+li);
      //ISPACES.log.debug('li.fileName = '+li.fileName);

      //li.scrollIntoView(true);

      var scrollHeight=fileDiv.scrollHeight;
      //ISPACES.log.debug('scrollHeight = '+scrollHeight);

      var clientHeight=fileDiv.clientHeight;
      //ISPACES.log.debug('clientHeight = '+clientHeight);
      //ISPACES.log.debug('scrollHeight-clientHeight = '+(scrollHeight-clientHeight));

      var scrollTop=fileDiv.scrollTop;
      //ISPACES.log.debug('scrollTop = '+scrollTop);

      var offsetTop=li.offsetTop;
      //ISPACES.log.debug('offsetTop = '+offsetTop);

      /*
      if(offsetTop>clientHeight){
        //li.scrollTo(offsetTop);
        //fileDiv.scrollTo(offsetTop);
        //fileDiv.scrollTop=offsetTop;
        fileDiv.scrollTop=offsetTop-clientHeight;
      }
      */

      var liPrevious=li.previousSibling;
      if(liPrevious){

        //ISPACES.log.debug('liPrevious.fileName = '+liPrevious.fileName);

        var isDir=liPrevious.isDir
        ,isOpen=liPrevious.isOpen
        ;
        //ISPACES.log.debug('isDir = '+isDir+', isOpen = '+isOpen);

        if(
          isDir
          &&isOpen
        ){
          //ISPACES.log.debug('liPrevious.ul = '+liPrevious.ul);
          var ul=liPrevious.ul;
          //var ul=liPrevious.parentNode;
          //var ul=liPrevious.firstChild;
          //ISPACES.log.debug('ul = '+ul);
          var childNodes=ul.childNodes;
          //ISPACES.log.debug('childNodes.length = '+childNodes.length);
          if(childNodes.length>0){
            liPrevious=childNodes[(childNodes.length-1)];
          }
        }
      }

      //*
      if(!liPrevious){ // We must be at the start of a folder. Go up one level.
        //ISPACES.log.debug('this.li.ul = '+this.li.ul);
        //ISPACES.log.debug('this.li.ul.parentNode = '+this.li.ul.parentNode);
        //ISPACES.log.debug('this.li.ul.parentNode.parentNode = '+this.li.ul.parentNode.parentNode);
        //ISPACES.log.debug('this.li.ul.li = '+this.li.ul.li);
        //ISPACES.log.debug('this.li.parentNode = '+this.li.parentNode);
        //ISPACES.log.debug('this.li.parentNode == this.li.ul = '+(this.li.parentNode == this.li.ul));
        //ISPACES.log.debug('this.li.parentNode.li = '+this.li.parentNode.li);

        var ulParent=li.parentNode;
        //ISPACES.log.debug('ulParent = '+ulParent);
        //ISPACES.log.debug('ulParent.parentNode = '+ulParent.parentNode);
        //ISPACES.log.debug('ulParent.parentNode.parentNode = '+ulParent.parentNode.parentNode);

        var liParent=ulParent.li;
        //ISPACES.log.debug('liParent = '+liParent);
        liPrevious=liParent;
      }

      if(liPrevious){ // We may be at the top of the directory tree.

        //this.deselectLi(this.li);
        //this.selectLi(liPrevious);

        if(isCtrl){

          /*
          if(!this.multipleLisSelected)this.lis.push(li); // Add the previous selected li. We are doing a multiple select using the CTRL key.

          this.lis.push(liPrevious);
          this.multipleLisSelected=true;

          if(this.goingDown){
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          */

          //this.toggleMultipleSelect(liPrevious);

          /*
          if(this.goingDown){
            //this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          //}else{
            this.toggleMultipleSelect(li);
          }
          */
          ///*
          //ISPACES.log.debug('this.goingDown = '+this.goingDown);
          if(this.goingDown){
            //this.goingDown=false;
            //if(this.multipleLisSelected){
              this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
              this.selectLi(liPrevious);
              return;
            //}
          }
          //*/

          /*
          if(this.multipleLisSelected){
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            //this.selectLi(liNext);
            if(this.goingDown){
              this.goingDown=false;
              this.selectLi(liPrevious);
              return;
            }
          }
          //*/

          /*
          if(li.on){
          //if(!li.on){
            //this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            this.toggleMultipleSelect(li);
          //  return;
          }else{
            this.toggleMultipleSelect(liPrevious);
          }
          //*/

          this.toggleMultipleSelect(liPrevious);

          this.goingUp=true;

        }else{

          this.goingUp=false;

          //ISPACES.log.debug('this.multipleLisSelected = '+this.multipleLisSelected);
          if(this.multipleLisSelected){
            this.deselectAllLis();
          }else{
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          this.selectLi(liPrevious);
        }
        //this.selectLi(liPrevious);

      }
    }
    this.goingDown=false;
  }

  ,downArrow:function(){
    //ISPACES.log.debug(this.id+'.downArrow()');

    var panelCell=this.panelCell;
    //ISPACES.log.debug('panelCell = '+panelCell);

    var li=panelCell.li;
    var fileDiv=panelCell.fileDiv;
    var isCtrl=this.isCtrl;

    //ISPACES.log.debug('isCtrl = '+isCtrl);

    if(li){
      //ISPACES.log.debug('li = '+li);
      //ISPACES.log.debug('li.fileName = '+li.fileName);

      var scrollHeight=fileDiv.scrollHeight;
      //ISPACES.log.debug('scrollHeight = '+scrollHeight);

      var clientHeight=fileDiv.clientHeight;
      //ISPACES.log.debug('clientHeight = '+clientHeight);
      //ISPACES.log.debug('scrollHeight-clientHeight = '+(scrollHeight-clientHeight));

      var scrollTop=fileDiv.scrollTop;
      //ISPACES.log.debug('scrollTop = '+scrollTop);

      var offsetTop=li.offsetTop;
      //ISPACES.log.debug('offsetTop = '+offsetTop);

      if(offsetTop>clientHeight){
        //li.scrollTo(offsetTop);
        //fileDiv.scrollTo(offsetTop);
        //fileDiv.scrollTop=offsetTop;
        fileDiv.scrollTop=offsetTop-clientHeight;
      }

      //li.scrollIntoView();
      //li.scrollIntoView(true);
      //li.scrollIntoView(false);

      var liNext=li.nextSibling;
      var ulParent=li.parentNode;
      //ISPACES.log.debug('ulParent = '+ulParent);
      //ISPACES.log.debug('ulParent.childNodes.length = '+ulParent.childNodes.length);

      //if(liNext)liNext.scrollIntoView(false);

      var isDir=li.isDir;
      var isOpen=li.isOpen;
      //ISPACES.log.debug('isDir = '+isDir+', isOpen = '+isOpen);
      if(
        isDir
        &&isOpen
      ){
        //var ul=li.ul;
        //var ul=li.childUl;
        var ul=li.ul;
        //ISPACES.log.debug('ul = '+ul);
        var childNodes=ul.childNodes;
        //ISPACES.log.debug('childNodes.length = '+childNodes.length);
        if(childNodes.length>0){
          //var li0=childNodes[0];
          liNext=childNodes[0];
        }
      }

      if(!liNext){ // We must be at the end of a folder. Go up one level.
        //var index=ulParent.getIndex(liNext);
        //ISPACES.log.debug('index = '+index);
        liNext=ulParent.parentNode.nextSibling;
      }

      if(liNext){ // We may be at the bottom of the directory tree.

        //ISPACES.log.debug(this.id+'.downArrow(): liNext.fileName = '+liNext.fileName);

        /*
        if(!isCtrl){
          if(this.multipleLisSelected){
            this.deselectAllLis();
          }else{
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
        }
        this.selectLi(liNext);
        */

        if(isCtrl){

          /*
          if(!this.multipleLisSelected)this.lis.push(li); // Add the previous selected li. We are doing a multiple select using the CTRL key.
          this.lis.push(liNext);
          this.multipleLisSelected=true;
          */

          //this.toggleMultipleSelect(liNext);
          //this.toggleMultipleSelect(li);

          /*
          if(this.goingUp){
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }else{
            this.toggleMultipleSelect(li);
          }
          if(this.goingUp){
            //this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            this.toggleMultipleSelect(li);
          }
          */
          //if(this.goingUp){
          //  this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          //}
          /*
          if(this.goingUp){
            this.toggleMultipleSelect(li);
          }else{
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          */

          //*
          //ISPACES.log.debug('this.goingUp = '+this.goingUp);
          if(this.goingUp){
            //this.goingUp=false;
            //if(this.multipleLisSelected){
              this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
              this.selectLi(liNext);
              return;
            //}
          }
          //*/

          /*
          if(this.multipleLisSelected){
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            //this.selectLi(liNext);
            if(this.goingUp){
              this.goingUp=false;
              this.selectLi(liNext);
              return;
            }
          }
          //*/

          /*
          if(li.on){
            //this.selectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            this.toggleMultipleSelect(li);
            //return;
          }else{
            this.toggleMultipleSelect(liNext);
          }
          //*/

          this.toggleMultipleSelect(liNext);

          /*
          var liNextOn=liNext.on;
          ISPACES.log.debug('liNextOn = '+liNextOn);
          if(liNextOn){
          }
          */

          this.goingDown=true;

        }else{

          this.goingDown=false;

          //*
          //ISPACES.log.debug('this.multipleLisSelected = '+this.multipleLisSelected);
          if(this.multipleLisSelected){
            this.deselectAllLis();
          }else{
            this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          //*/
          this.selectLi(liNext);
        }
        //this.selectLi(liNext);

        //this.toggleMultipleSelect(liNext);

        //ISPACES.log.debug('liNext = '+liNext);
        //if(!isCtrl)this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.toggleMultipleSelect(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.clickLi(e,li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.clickLi(null,li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.deselectAllLis(); // Holding the CTRL key allow select multiple. So, do not deselect the selected.

        /*
        if(!isCtrl){
          if(this.multipleLisSelected){
            this.deselectAllLis();
          }
          this.deselectLi(li); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          //this.toggleMultipleSelect(li);
        }else{

          this.selectLi(liNext);
          this.lis.push(liNext);

          if(li.on){
            this.deselectLi(li);
            this.lis.remove(li);
          }else{
            this.selectLi(li);
            this.lis.push(li);
            this.multipleLisSelected=true;
          }
        }
        */

        /*
          ISPACES.log.debug('isCtrl = '+isCtrl);
          this.toggleMultipleSelect(li);
          //this.toggleMultipleSelect(li,div);
        }else{
          if(this.multipleLisSelected){
            this.deselectAllLis();
          //}else{
          //  this.lis.clear();
          //  if(this.li)this.deselectLi(this.li);
          }
        }
        */

        //this.selectLi(liNext);
        //this.lis.push(liNext);
        //this.toggleMultipleSelect(liNext);
        //this.trMouseDown(null,this.tr,this.selectedFileDiv);
      }
    }
    this.goingUp=false;
  }

  ,rightArrow:function(e){
    ISPACES.log.debug(this.id+'.rightArrow('+e+')');
    if(this.li){
      if(this.li.isDir){
        //this.li.isOpen=false;
        //this.toggleOpenFolder(e,this.li);
        this.toggleOpenFolder(this.li,e);
      }
    }
    e.preventDefault(); // prevent the right arrow from scrolling the page right, where a window has crossed the right side of the browser viewport.
  }

  ,leftArrow:function(e){
    //ISPACES.log.debug(this.id+'.leftArrow('+e+')');
    if(this.li){
      //ISPACES.log.debug('this.li = '+this.li);
      if(this.li.isDir){
        //ISPACES.log.debug('this.li.isDir = '+this.li.isDir);
        //this.toggleOpenFolder(e,this.li);
        this.toggleOpenFolder(this.li,e);
      }
    }
  }

  ,end:function(){
    //ISPACES.log.debug(this.id+'.end()');
    //ISPACES.log.debug(this.id+'.end(): this.cell = '+this.cell+', this.cell.tree = '+this.cell.tree);

    /*
    if(this.cell.tree){
      if(this.li){
        var liNext=this.li.nextSibling;
        if(liNext){
          this.deselectLi(this.li);
          this.selectLi(liNext);
          //this.trMouseDown(null,this.tr,this.selectedFileDiv);
        }
      }
    }else{
      if(this.tr){
        var rowDown=this.tr.nextSibling;
        if(rowDown){
          this.deselectTr(this.tr);
          this.selectTr(rowDown);
          //this.trMouseDown(null,this.tr,this.selectedFileDiv);
        }
      }
    }
    */
    var tbody=this.tr.parentNode; // TBODY
    var childNodes=tbody.childNodes;
    if(childNodes){
      this.deselectTr(this.tr);
      this.selectTr(childNodes[childNodes.length-1]);
    }
  }

  ,home:function(){
    //ISPACES.log.debug(this.id+'.home()');
    var tbody=this.tr.parentNode; // TBODY
    this.deselectTr(this.tr);
    this.selectTr(tbody.fC());
  }

  ,spacebar:function(){
    ISPACES.log.debug(this.id+'.spacebar()');

    //ISPACES.log.debug(this.id+'.spacebar(): this.tr = '+this.tr);
    //ISPACES.log.debug(this.id+'.spacebar(): this.tr.path = '+this.tr.path);
    //ISPACES.log.debug(this.id+'.spacebar(): this.tr.fullPath = '+this.tr.fullPath);
    //this.selectedPath.input.value=this.rowSelected.path;
    //this.selectedPath.input.value=this.rowSelected.fullPath;
    if(this.selectedPath)this.selectedPath.input.value=this.tr.fullPath;
  }

  ,escapeKey:function(e){
    ISPACES.log.debug(this.id+'.escapeKey()');
    if(this.modal&&this.modal.on){ // If the modal window is showing, we pass the event on to the modal.
      this.modal.escapeKey(e);
      return;
    }
    if(this.selectedPath)this.selectedPath.input.value=this.tr.path;
  }

  ,deleteKey:function(e){
    ISPACES.log.debug(this.id+'.deleteKey('+e+')');
    //this.del();
    this.del(e);
    //if(this.selectedPath)this.selectedPath.input.value=this.tr.path;
  }

  ,f5:function(){
    ISPACES.log.debug(this.id+'.f5()');
    this.copy();
  }

  ,f6:function(){
    ISPACES.log.debug(this.id+'.f6()');
    this.move();
  }

  ,f7:function(){
    //ISPACES.log.debug(this.id+'.f7()');
    this.newFolder();
  }

  ,tabKey:function(){
    //ISPACES.log.debug(this.id+'.tabKey()');

    var panelCell=this.panelCell
    ,panelIndex=panelCell.i
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ;

    //ISPACES.log.debug('panelIndex = '+panelIndex);
    //ISPACES.log.debug('this.isShift = '+this.isShift);

    if(this.isShift){
      --panelIndex;
      if(panelIndex<0)panelIndex=(z-1);
    }else{
      ++panelIndex;
      if(panelIndex>=z)panelIndex=0;
    }
    //ISPACES.log.debug('panelIndex = '+panelIndex);

    var nextPanel=panelCells[panelIndex];
    this.panelMouseDown(nextPanel);
    this.panelMouseDownBefore(nextPanel);

    /*
    var panelCell,panelCells=this.panelCells;
    for(var i=0;i<panelCells.length;i++){
      panelCell=this.panelCells[i];
      ISPACES.log.debug('panelCell.i = '+panelCell.i+', panelCell.millis = '+panelCell.millis);
    }

    panelCells.sort(this.sortByMillis); // re-sort the apps by their last accessed milliseconds

    for(var i=0;i<panelCells.length;i++){
      panelCell=this.panelCells[i];
      ISPACES.log.debug('panelCell.i = '+panelCell.i+', panelCell.millis = '+panelCell.millis);
    }
    */

  }

});

ISPACES.FileManager.start=function(json){
  //ISPACES.log.debug('FileManager.start('+json+')');

  var o=eval(json);
  var fileManager=new ISPACES.FileManager(o);
  ISPACES.spaces.space.addAp(fileManager,o.alive);

  return fileManager;
};
