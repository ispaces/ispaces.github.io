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

//Common.required("Files"); // Now included in main os download.
//Common.required("Roots"); // Now included in main os download.
//Common.required("Sounds"); // Now included in main os download.
//Common.required("ResizableWindow",true); // For development, to reload the ResizableWindow from source, each time this class is loaded.

/* Experimental functionality to load multiple required classes.
var required=[
  "Files"
  ,"Roots"
  //,"Sounds"
  ,"ResizableWindow"
];
Ispaces.logger.debug('required = '+required);
Ispaces.logger.alert('required = '+required);
//Common.required(required,true);
*/

/**
 * @class Represents an iSpaces FileManager Application.
 * @constructor
 * @extends Ispaces.Application
 */
/**
 * @class Represents an iSpaces FileManager Note Application.
 * @constructor
 * @extends Ispaces.Application
 */
Ispaces.FileManager=function(config){
  Ispaces.logger.debug(this.classId+'('+config+')');
  Ispaces.logger.debugI18n(this.classId,'('+config+')');

  //*
  if(arguments.length){
    for(var i=0;i<arguments.length;i++){
      Ispaces.logger.debug('    arguments['+i+'] = '+arguments[i]);
      if(Common.isObject(arguments[i])){
        for(var p in arguments[i]){Ispaces.logger.debug('    '+p+' = '+arguments[i][p])}
      }
    }
  }
  //*/

  var _this=this;

  /*
   * OO - Object Oriented
   * Call the super class constructor (Application), passing along the arguments to the super class constructor.
   */
  Ispaces.Application.apply(_this,arguments); // Call the super constructor - Ispaces.Application.

  _this.configure(config);

  Ispaces.Languages.componentRequired(_this.classId);

  Ispaces.ui.setTheme(
    _this.classId
    //+"TabbedMenu"
    //+"nav-menu"
    +"table-data"
  );
  Common.asyncCall(_this,_this.reloadStyle,1000);

  /*
  if(this.config.instanceId){ // If this app is a recreation
    Ispaces.spaces.getSpace().store.getPersistable(this);
  }else{
    this.init();
  }
  //*/
  _this.init();
};

/**
 * OO - Object Oriented.
 * Set the FileManager prototype to the Application prototype, by creating an no-args instance of Application.
 */
//Ispaces.FileManager.prototype=new Ispaces.Application();
Common.extendClass(Ispaces.FileManager,Ispaces.Application);

/*
 * Reset the constructor back to the FileManager as it assumes the Application constructor in the line above.
 */
//Ispaces.FileManager.prototype.constructor=Ispaces.FileManager; // replenish the constructor

Common.extend(Ispaces.FileManager.prototype,{

  classId:"FileManager"
  ,WidthHeight:[888,480]
  ,debug:false
  ,extension:'folder'
  ,grabberWidth:9
  ,borderWidth:8
  ,panelCount:2
  ,PROGRESS_WAIT:1000  // How long to wait on a file transfer before showing a progress modal.
  //,DEFAULT_COLUMN_WIDTHS:[250,75,120]
  //,DEFAULT_VIEW:"flat"
  ,DEFAULT_VIEW:"tree"
  ,threshold:5  // the distance in pixels that dragging has to cross before a clone is created and a real drag happens

  /**
   * Add a local "Constants" property referencing contants used in this application.
   */
  ,Constants:(function(){
    var Characters=Constants.Characters;
    return{
      FORWARDSLASH:Characters.FORWARDSLASH
      ,DOT:Characters.DOT
      ,EMPTY:Characters.EMPTY
      ,COLON:Characters.COLON
      ,UL:Constants.Tags.UL
      ,TBODY:Constants.Tags.TBODY
    }
  })()

  /**
   * Add a local "Events" property to reference events used in this application.
   */
  ,Events:(function(){
    var Events=Constants.Events;
    return{
      MOUSEDOWN:Events.MOUSEDOWN
      ,MOUSEUP:Events.MOUSEUP
      ,MOUSEMOVE:Events.MOUSEMOVE
      ,DBLCLICK:Events.DBLCLICK
      ,CONTEXTMENU:Events.CONTEXTMENU
      ,CLICK:Events.CLICK
    }
  })()

  ,reloadStyle:function(){
    Ispaces.logger.debug(this.id+'.reloadStyle()');

    Ispaces.ui.setTheme(
      this.classId
      //+"TabbedMenu"
      //+"nav-menu"
      +"table-data"
    );
  }

  //*
  ,updateId:function(databaseId){
    Ispaces.logger.debug(this.id+'.updateId('+databaseId+')');

    var _this=this;

    _this.id=new Ispaces.StringBuilder([
      Ispaces.Languages.getText(_this.classId)
      ,Constants.Characters.UNDERSCORE
      ,databaseId
    ]).asString();

    Ispaces.logger.debug('this.id = '+_this.id);

    Ispaces.logger.debug('Ispaces['+this.id+']='+this);
    Ispaces[this.id]=this; // Set a reference to this object on the global Ispaces namespace, so that the embedded applet can talk directly to it.
    //Ispaces.logger.debug('window["'+_this.id+'"]='+_this);
    //window[_this.id]=_this; // Set a direct reference to this object on the global namespace, so that the embedded applet can talk directly to it.

    if(this.resizableWindow)this.resizableWindow.updateId(databaseId);  // Also update sub components like the ResizableWindow.
  }

  //*/
  /**
   * For convenience, the config object can be passed to this configure function... to configure this object instance.
   */
  ,configure:function(config){
    Ispaces.logger.debug(this.classId+'.configure('+config+')');

    var _this=this;

    if(config){ // The config object can be null/undefined.
      var databaseId=config["databaseId"];
    }

    _this.id=new Ispaces.StringBuilder([
      Ispaces.Languages.getText(_this.classId)
      ,Constants.Characters.UNDERSCORE
      ,_this.instanceId  // The instanceId gets set in the super class Ispaces.Persistable.
    ]).asString();

    Ispaces.logger.debug('this.id = '+_this.id);

    //eval(this.id+'=this;'); // Set a direct reference to this object on the global namespace, so that the embedded applet can talk directly to it.
    //Ispaces[_this.id]=_this; // Set a direct reference to this object on the global namespace, so that the embedded applet can talk directly to it. THis could be moved to where local file access is requested.
    // Moved this to updateId()... @see setDatabaseId()

    //_this.windowTitle='1234567890 1234567890 1234567890 1234567890 1234567890 1234567890 1234567890'; // For debugging long window title.
    //_this.windowTitle=Ispaces.JSONS.Titles[_this.classId];
    //_this.windowTitle=Constants.Titles[_this.classId];
    //_this.windowTitleNode=Create.createTextNodeI18n(Constants.Titles[_this.classId]); // For internationalization (I18N), we create a textNode for the title so it can be updated.
    //_this.windowTitleNode=Create.createTextNodeI18n(Constants.Titles[_this.classId]||_this.classId); // For internationalization (I18N), we create a textNode for the title so it can be updated.
    _this.windowTitleNode=Create.createTextNodeI18n(Constants.Titles[_this.classId]); // For internationalization (I18N), we create a textNode for the title so it can be updated.

    //if(!Ispaces.languages.contains(_this.classId))Ispaces.languages.getSubset(_this.classId);

    //_this.windowTitle=Ispaces.JSONS.Titles[_this.classId]();
    //_this.windowTitle=Ispaces.JSONS.Titles[_this.classId];
    _this.windowTitleNode=Create.createTextNodeI18n(Constants.Titles[_this.classId]); // For internationalization (I18N), we create a textNode for the title so it can be updated.

    //_this.headers=['Name','Size','Date'];
    _this.headers=[
      {title:"Name",name:'name',_width:200}
      ,{title:"Size",name:'size',_width:75}
      ,{title:"Date",name:'date',_width:120}
      ,{title:Constants.Characters.NBSP,name:Constants.Characters.EMPTY,_width:Common.getWindowWidthHeight()[0]}
    ];

    _this.panelCells=[];
    //_this.selectedFiles=[];
    _this.tableRows=[]; // Each file is represented by a table row. We create this array to keep a running list of selected rows when doing a multi-select.
    _this.fileElements=[];
    //_this.dropTargets=[];
    //_this.dropPanels=[];
    //_this.dropFolders=[]; // To hold an array of drop folders. @volatile in that that array gets filled and emptied as user selects and deselects folders (in the tile view right now...). // dropFolders are now a property of the cellPanel
    _this.contextMenus={};

    if(_this.config.instanceId)_this.panelCount=0; // If this is a recreation, do not add any panels at startup.

    //_this.columnWidths=_this.DEFAULT_COLUMN_WIDTHS;


    /*
     * An application can have a unique persistence URL, to overrise the default persistence URL in Application.
     */
    /*
    var FORWARDSLASH=_this.Constants.FORWARDSLASH;
    _this.persistenceUrl=new Ispaces.StringBuilder([
      Ispaces.contextUrl
      ,'/application/',_this.classId
      ,FORWARDSLASH,_this.instanceId
      ,FORWARDSLASH,Ispaces.spaces.getSpace().databaseId
      ,_this.Constants.QUESTIONMARK,Common.getMilliseconds()  // IE caches the response, so add a unique identifier to the URL.
    ]).asString();
    */

  }

  ,init:function(){
    Ispaces.logger.debug(this.id+'.init()');

    var _this=this;

    _this.divApplication=_this.createApplication().setClass(_this.classId); // Create the application.

    _this.resizable={
      setWidthPixels:_this.setWidthPixels.bind(_this)
      ,setHeightPixels:_this.setHeightPixels.bind(_this)
    };

    var resizableWindow=_this.resizableWindow;

    _this.divApplicationWindow=resizableWindow.divApplication; // set a reference to the divApplicationWindow. @see drag()

    resizableWindow.addResizables(); //  Add the resizable handles to the resizable window.
    resizableWindow.addApplication(); // Add the application to the resizable window.
    resizableWindow.hide(); // Hide the application before appending it to the DOM.
    resizableWindow.launch(); // Launch the application by appending it to the DOM.

    //_this.setDimensions(); // A call to set the dimensions of the window after it has been built and added to the DOM.
    _this.setWidthPixels(_this.WidthHeight[0]),_this.setHeightPixels(_this.WidthHeight[1]); // Set the preferred width/height after the app has been added to the DOM but before it has been shown.

    //resizableWindow.showCenter(); // Finally, show the app.

    /*
    if(_this.config.instanceId){ // If this app is a recreation.
      Ispaces.persistence.getPersistable(_this);
      resizableWindow.showCenter(); // Finally, show the window.
    }else{
      _this.mouseDownPanelCapturing(_this.panelCells[0]); // simulate the mousedown on the first panel to select it.
      _this.setWidthPixels(_this.WidthHeight[0])
      ,_this.setHeightPixels(_this.WidthHeight[1])
      ;
      _this.setDimensions(); // A call to set the dimensions of the window after it has been built and added to the DOM.
      resizableWindow.showCenter(); // Finally, show the window.
      var xy=Common.getXY(_this.divApplication);
      var widthHeight=Common.getWidthHeight(_this.divApplication);
      Ispaces.logger.debug('xy = '+xy);
      Ispaces.logger.debug('widthHeight = '+widthHeight);
      // Temporary fix - these two calls to the server should be amalgamated.
      Ispaces.persistence.resetPersistable(
        this
        ,"setWH"
        ,widthHeight
      );
      Ispaces.persistence.resetPersistable(
        this
        ,"setXY"
        ,xy
      );
    }
    */

    this.persist();
    //Common.asyncCall(_this,_this.persist,1);
  }

  /*
  ,show:function(){
    Ispaces.logger.debug(this.id+'.show()');
    Ispaces.logger.alert(this.id+'.show()');
  }
  */

  /**
   * @override Application.launch to pprovide the custom functionality of selecting the first panel.
   */
  ,launch:function(){
    Ispaces.logger.debug(this.id+'.launch()');
    //Ispaces.logger.alert(this.id+'.launch()');

    var _this=this;

    _this.mouseDownPanelCapturing(_this.panelCells[0]); // Simulate the mousedown on the first panel to select it.

    var WidthHeight=_this.WidthHeight;
    _this.setWidthPixels(WidthHeight[0]),_this.setHeightPixels(WidthHeight[1]);

    var resizableWindow=_this.resizableWindow; // Inner applications do not have a ResizableWindow.

    //this.setDimensions();

    //resizableWindow.launch(); // Launch the application by appending it to the DOM.
    resizableWindow.show();
    resizableWindow.showCenter();

    Common.asyncCall(this,this.setDimensions,1); // Call setDimensions() asynchronously, so the UI can be measured and the widths set.
  }

  /*
   * This function gets called after the FileManager has been built and displayed on the screen.
   * It set the width & height of the file divs that hold the file trees so the resizing can occur.
   * It also creates the centering table for the modals.
   */
  ,setDimensions:function(){
    Ispaces.logger.debug(this.id+'.setDimensions()');

    //return;

    var divApplication=this.divApplication;

    divApplication.widthHeight=Common.getWidthHeight(divApplication);
    Ispaces.logger.debug('divApplication.widthHeight = '+divApplication.widthHeight);

    //var w=this.divMain.w=Common.getWidth(this.divMain);
    //this.divMain.w=Common.getWidth(this.divMain);

    var applicationWidth=divApplication.widthHeight[0];

    this.adjustPanelWidthsPercent(applicationWidth);
    this.adjustPanels(applicationWidth);

    /*
     * Get a panel (the first one), get the rowFiles and measure it.
     */
    var cellPanel=this.panelCells[0];
    var rowFiles=cellPanel.rowFiles;
    var rowFilesWidthHeight=Common.getWidthHeight(rowFiles);

    //Ispaces.logger.debug('rowFilesWidthHeight = '+rowFilesWidthHeight);
  }

  ,resetDimensions:function(){
    Ispaces.logger.debug(this.id+'.resetDimensions()');

    var windowWidthHeight=Common.getWindowWidthHeight();
    Ispaces.logger.debug('windowWidthHeight = '+windowWidthHeight);

    var applicationWidthHeight=this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    Ispaces.logger.debug('applicationWidthHeight = '+applicationWidthHeight);

    /*
    //var w=this.divMain.w=Common.getWidth(this.divMain);
    this.divMain.w=Common.getWidth(this.divMain);
    Ispaces.logger.debug('this.divMain.w = '+this.divMain.w);
    */

    var applicationWidth=applicationWidthHeight[0];

    this.adjustPanelWidthsPercent(applicationWidth);
    this.adjustPanels(applicationWidth);

    //var overflowXY=getOverflow(windowWidthHeight[0],windowWidthHeight[1]);
    //Ispaces.logger.debug('overflowXY = '+overflowXY);

    //if(overflowXY[0]>0)this.application.setOverflowX(overflowXY[0]);
    //if(overflowXY[1]>0)this.application.setOverflowY(overflowXY[1]);

    return applicationWidthHeight; // REturn the applicationWidthHeight so it can be used elsewhere. @see setFileCellsHeights
  }

  /*
  ,setDimensions:function(){
    //Ispaces.logger.debug(this.id+'.setDimensions()');

    this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    this.divMain.widthHeight=Common.getWidthHeight(this.divMain);
    //this.bottomMenu.widthHeight=Common.getWidthHeight(this.bottomMenu);

    //Ispaces.logger.debug(this.id+'.setDimensions(): this.divApplication.widthHeight[0] = '+this.divApplication.widthHeight[0]+', this.divApplication.widthHeight[1] = '+this.divApplication.widthHeight[1]);
    //Ispaces.logger.debug(this.id+'.setDimensions(): this.divMain.widthHeight[0] = '+this.divMain.widthHeight[0]+', this.divMain.widthHeight[1] = '+this.divMain.widthHeight[1]);
    //Ispaces.logger.debug(this.id+'.setDimensions(): this.bottomMenu.widthHeight[0] = '+this.bottomMenu.widthHeight[0]+', this.bottomMenu.widthHeight[1] = '+this.bottomMenu.widthHeight[1]);

    //this.bottomMenu.setHeightPixels(this.bottomMenu.widthHeight[1]);
    //this.bottomMenu.setMaxHeight(this.bottomMenu.widthHeight[1]);
    //this.cellBottom.setHeightPixels(this.bottomMenu.widthHeight[1]);
    //this.cellBottom.setMaxHeight(this.bottomMenu.widthHeight[1]);

    this.greyout=this.createGreyout();
    this.resetGreyout();
    this.divApplication.add(this.greyout); // Add the greyout layer.

    this.centeringTable=this.createCenteringTable();
    this.resetCenteringTable();
    this.divApplication.add(this.centeringTable);

    //this.divApplication.setHeightPixels(this.divApplication.widthHeight[1]);
    //Common.unsetWidthHeight(this.divApplication); // After we reset the height of the addDiv, we unset it again so that it does not upset any resizing.
  }
  */


  ,createApplication:function(){
    Ispaces.logger.debug(this.id+'.createApplication()');

    var _this=this
    ,Create=_this.Create
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    ,createDivTable=Create.createDivTable
    ;

    /*
     * Create the ResizableWindow setting a reference to this.resizableWindow.
     * Order is especially important here, in that the DraggableApplication required the reference to 'this.resizableWindow' to be set.
     */
    var resizableWindow=new Ispaces.ResizableWindow(_this);
    _this.resizableWindow=resizableWindow; // DraggableApplication requires this reference to the ResizableWindow to be set.
    var titlebar=resizableWindow.createTitlebar();  // Some applications might not want the titlebar. Leave it up to the application to decide if it wants to create one.
    new Ispaces.DraggableApplication(_this,titlebar);

    var cellTitlebar=createDivCell(titlebar)
    ,rowTitlebar=createDivRow(cellTitlebar)
    ;

    /*
     * main div
     */
    var divMain=this.createMain()
    //var divMain=_this.createMain().setClass("main")
    //var divMain=_this.createMain().setClass(this.classId+"Main")
    //,cellMain=createDivCell(divMain)
    ,cellMain=createDivCell(divMain).setClass("cell-main")
    ,rowMain=createDivRow(cellMain)
    /*
    ,divTable=Create.createDivTable([
      rowTitlebar
      ,rowMain
    ])
    */
    ;


    /*
     * bottom menu
     */
    var bottomMenu=this.createBottomMenu()
    ,cellBottom=createDivCell(bottomMenu)
    ,tableBottom=createDivTable(createDivRow(cellBottom))
    ,rowBottom=createDivRow(tableBottom)
    ;

    var divTable=Create.createDivTable([
      rowTitlebar
      ,rowMain
      ,rowBottom
    ]);

    /*
     * References
     */
    _this.divMain=divMain;
    _this.divTable=divTable;

    /*
     * Style
     */
    tableBottom.setWidthPercent(100);
    cellBottom.setOverflow(Constants.Properties.HIDDEN);
    cellBottom.setMaxWidth(1); // Strangely enough, this allows the bottom menu overflow:hidden to work
    var height=33;
    rowBottom.setHeightPixels(height),rowBottom.setMaxHeight(height);
    divTable.setWidthHeightPercent(100);
    divTable.setOverflow(Constants.Properties.HIDDEN);

    return Create.createDiv(divTable);
  }

  //*
  ,recreate:function(roots){
    Ispaces.logger.debug(this.id+'.recreate('+roots+')');

    var _this=this
    ,cellPanel
    ,protocol
    ;

    var x=0; // Increment... temporary for the centerGRabber. Idea move the center grabber creation...

    var panelCells=[]    // panelCells
    ,panelCellsUi=[]     // panelCells for the UI
    ;

    roots.forEach(function(root){

      Ispaces.logger.debug('root = '+root);

      protocol=root['protocol'];

      Ispaces.logger.debug('protocol = '+protocol);

      cellPanel=_this.createPanel();

      cellPanel.protocol=protocol; // Set the protocol as a property of the cellPanel. @see save() & recreate()

      _this.tree({
        protocol:protocol
        ,cellPanel:cellPanel
      });

      if(x++>0)panelCellsUi.push(_this.createCenterGrabber());

      panelCellsUi.push(cellPanel); // for the ui
      panelCells.push(cellPanel); // for reference

      cellPanel.position=panelCells.length; // Set the position/index before adding to the array of panelCells.
    });

    Ispaces.logger.debug('panelCells = '+panelCells);
    Ispaces.logger.debug('panelCellsUi = '+panelCellsUi);
    Ispaces.logger.debug('this.panelTable = '+this.panelTable);

    //this.setDimensions();
    //this.resetDimensions();

    var panelRow=this.panelRow=this.Create.createDivRow(panelCellsUi);  // Double set - Also et a reference to 'this.panelRow' for adding and removing panels.
    this.panelTable.replace(panelRow);

    this.panelCells=panelCells;   // Set a reference to the panelCells on the FileManager instance.

    //this.resetWidthHeight();

    //this.panelTable.setWidthHeightPercent(100);
    //this.panelTable.alignTop();
    //panelRow.alignTop();

    // Debugging...
    //panelRow.setBackgroundColor(Constants.Colors.GREEN);
    //this.panelTable.setBorder(Constants.Borders.RED);
    //this.panelTable.setBackgroundColor(Constants.Colors.BLUE);

    //this.setDimensions();
    //this.resetDimensions();
    //Common.asyncCall(this,this.setDimensions,1); // Call setDimensions() asynchronously, so the UI can be measured and the widths set.
  }
  //*/

  ,recreateBak:function(roots){
    Ispaces.logger.debug(this.id+'.recreate('+roots+')');

    //Ispaces.logger.alert(this.id+'.recreate('+roots+'): TBD panelIndex');
    //return;

    var root                 // a single recreation array object. e.g [1,'ispaces'] or [2,'dropbox']
    //,panelIndex                    // the panel index
    ,protocol             // the protocol
    ,rootsLength=roots.length           // the length of recreations
    ,cellPanel
    ,panelCells=[]    // panelCells
    ,panelCellsUi=[]  // panelCells for the UI
    ,centerGrabber
    ,i                // the iterator index
    ;

    for(i=0;i<rootsLength;i++){

      root=roots[i]
      //,panelIndex=root[0]
      //,protocol=root[1]
      ,protocol=root['protocol']
      ;

      Ispaces.logger.debug('protocol = '+protocol);
      //Ispaces.logger.alert('panelIndex = '+panelIndex+', protocol = '+protocol);
      //Ispaces.logger.debug('panelIndex = '+panelIndex+', protocol = '+Ispaces.Languages.getString(protocol));

      if(protocol==null)continue;

      if(i>0)panelCellsUi.push(this.createCenterGrabber());

      //cellPanel=this.createPanel(panelIndex);
      cellPanel=this.createPanel(i);
      cellPanel.protocol=protocol; // Set the protocol as a property of the cellPanel. @see save() & recreate()
      //Ispaces.logger.debug('cellPanel.panelIndex=panelIndex; Is this needed? or is this set in createPanel()?');
      //cellPanel.panelIndex=panelIndex;
      Ispaces.logger.debug('cellPanel = '+cellPanel);

      //new Ispaces.AsyncApply(
      //  this
      //  ,"selectRoot"
      //  ,[cellPanel,protocol]
      //  ,10
      //);

      //new Ispaces.AsyncApply(
      //  this
      //  ,"recreateTree"
      //  ,[
      //    {
      //      protocol:protocol
      //      ,cellPanel:cellPanel
      //    }
      //  ]
      //  ,100
      //);

      cellPanel.position=panelCells.length; // Set the position/index before adding to the array of panelCells.
      panelCellsUi.push(cellPanel); // for the ui
      panelCells.push(cellPanel); // for reference

      Ispaces.logger.debug('this.panelCells = '+this.panelCells);
    }

    this.panelCells=panelCells; // set a reference to the panelCells on the FileManager instance.

    //this.panelRow.addAll([centerGrabber,cellPanel]);
    var panelRow=this.Create.createDivRow(panelCellsUi);
    this.panelRow=panelRow; // for panel insertion
    panelRow.setBackgroundColor(Constants.Colors.GREEN);
    panelRow.alignTop();

    //Ispaces.logger.debug('this.divTable = '+this.divTable);
    //Ispaces.logger.debug('this.panelTable = '+this.panelTable);

    //this.divTable.replace(panelRow);
    this.panelTable.replace(panelRow);

    this.panelTable.setWidthHeightPercent(100);
    this.panelTable.setBorder(Constants.Borders.RED);
    this.panelTable.setBackgroundColor(Constants.Colors.BLUE);
    this.panelTable.alignTop();

    //this.setDimensions();
    //this.resetWidthHeight();
    //this.setWidthPixels(this.WidthHeight[0]);
    //this.setHeightPixels(this.WidthHeight[1]);

  /*
        var w=Common.getWidth(this.divMain);
        this.resizingStarted(w);
        this.adjustPanels(w); // Adjust the panel widths after creating the new panel, but before adding it to the DOM.

        var panel0=this.panelCells[0];
        var rowFiles=panel0.rowFiles;
        var rowFilesHeight=Common.getHeight(rowFiles);
        Ispaces.logger.debug('rowFilesHeight = '+rowFilesHeight);
        this.setFileCellsHeights(rowFilesHeight);
  */

      //listItem.ocButton(this.mouseDownRoot.bind(this,listItem));

      /*
      // Create the tree and add it to the panel divFiles.
      var tree=this.tree(protocol);
      Ispaces.logger.debug('tree = '+tree);

      if(tree){ // The tree function returns null where there needs to be authentication.
        cellPanel.divFiles.replaceFirst(tree); // Replace the old file table with the new one.
      }
      */

      //this.setDimensions(); // A call to set the dimensions of the window after it has been built and added to the DOM.

      /*
      var o={
        protocol:protocol
        ,cellPanel:cellPanel
      };

      new Ispaces.AsyncApply(this,"recreateTree",[o],1);
      */

      /*
      // Select the root in the dropdown.
      //var rootUnorderedList=panelDrag.rootUnorderedList;
      //var listItem,listItems=rootUnorderedList.listItems;
      var ul=cellPanel.rootUnorderedList;
      var listItem,listItems=ul.listItems;
      for(var j=0;j<listItems.length;j++){
        listItem=listItems[j];
        var protocolJ=listItem.protocol;
        Ispaces.logger.debug('protocolJ = '+protocolJ);

        //this.mouseDownRoot(listItem);

        //this.cellPanel.protocol=protocol; // Set the protocol as a property of the cellPanel. @see save() & recreate()

        if(protocol==protocolJ){
          listItem.setClass('selected');
        }else{
          listItem.setClass(this.Constants.EMPTY);
        }

      }
      //*/

    //}
  }

  /*
  ,resetPanelsAfterRecreation:function(){
    Ispaces.logger.debug(this.id+'.resetPanelsAfterRecreation()');
    Ispaces.logger.alert(this.id+'.resetPanelsAfterRecreation()');
  }
  */

  ,resetWidthHeight:function(){
    Ispaces.logger.debug(this.id+'.resetWidthHeight()');

    this.setDimensions(); // A call to set the dimensions of the window here so the main area is not overflowed.

    var widthHeight=Common.getWidthHeight(this.divApplication);
    Ispaces.logger.debug('widthHeight = '+widthHeight);
    //Ispaces.logger.debug('this.WidthHeight = '+this.WidthHeight);

    //this.setWidthPixels(this.WidthHeight[0]),this.setHeightPixels(this.WidthHeight[1]);
    this.setWidthPixels(widthHeight[0]),this.setHeightPixels(widthHeight[1]);
  }

  ,recreateTree:function(config){
    Ispaces.logger.debug(this.id+'.recreateTree(config:'+config+')');

    Ispaces.logger.debug('config.cellPanel = '+config.cellPanel);

    //var protocol=config.protocol;
    var cellPanel=config.cellPanel;

    /*
    // Create the tree and add it to the cellPanel divFiles.
    //var tree=this.createTree(protocol);
    var tree=this.createTree(o);
    Ispaces.logger.debug('tree = '+tree);
    if(tree){ // The createTree function returns null where there needs to be authentication.
      cellPanel.divFiles.replaceFirst(tree); // Replace the old file table with the new one.
      //this.selectRoot(cellPanel,o.protocol);
    }
    */
    this.tree(config);

    //this.selectRoot(cellPanel,config.protocol);

    /*
    new Ispaces.AsyncApply(
      this
      ,"selectRoot"
      ,[cellPanel,o.protocol]
      ,1000
    );
    */
  }

  /*
  if(this.config.instanceId){ // If this app is a recreation
    Ispaces.spaces.getSpace().store.getPersistable(this);
  }else{
    this.init();
  }
  */

  ,selectRoot:function(cellPanel,protocol){
    Ispaces.logger.debug(this.id+'.selectRoot(cellPanel:'+cellPanel+', protocol:"'+protocol+'")');

    var rootUnorderedList=cellPanel.rootUnorderedList
    ,listItems=rootUnorderedList.childNodes
    ,listItemsLength=listItems.length
    ,listItemProtocol
    ,listItem
    ,i
    ,EMPTY=this.Constants.EMPTY
    ;

    for(i=0;i<listItemsLength;i++){

      listItem=listItems[i]
      ,listItemProtocol=listItem.protocol
      ;

      //Ispaces.logger.debug('protocol = "'+protocol+'", listItemProtocol = "'+listItemProtocol+'"');

      //this.cellPanel.protocol=protocol; // Set the protocol as a property of the cellPanel. @see save() & recreate()

      if(protocol==listItemProtocol){

        listItem.setClass("selected");

        rootUnorderedList.listItem=listItem; // grab the selected list item, so we can reselect it after recreating the root select.
        Ispaces.logger.debug('rootUnorderedList.listItem = '+rootUnorderedList.listItem);
        //rootUnorderedList.isOpen=true;
        //this.mouseDownRoot(listItem);

      }else{
        listItem.setClass(EMPTY);
      }
    }
  }

  ,createMain:function(){
    Ispaces.logger.debug(this.id+'.createMain()');

    var _this=this
    ,Create=_this.Create
    ,i
    ,a=[]
    ,cellPanel
    ,panelCount=this.panelCount
    ;

    for(i=0;i<panelCount;i++){

      if(i>0)a.push(_this.createCenterGrabber());

      cellPanel=_this.createPanel(i);
      cellPanel.widthPercent=.5;

      cellPanel.position=_this.panelCells.length; // Set the position/index before adding to the array of panelCells.

      a.push(cellPanel); // for the ui
      _this.panelCells.push(cellPanel); // for reference
    }

    Ispaces.logger.debug('this.panelCells = '+this.panelCells);

    var panelRow=Create.createDivRow(a)
    ,divTable=Create.createDivTable(panelRow)
    ;

    /*
     * Set some local references.
     */
    _this.panelRow=panelRow; // for new panel insertion
    _this.panelTable=divTable; // for recreation of the panel row

    return divTable;
  }

  /**
   * Function responsible for creating a single panel for the FileManager UI.
   * It returns a DIV with style display:table-cell for insertion into the DOM.
   * The variable cellPanel is used to represent the panel cell that is returned from this function with the class "cell-panel".
   * The cellPanel holds a reference to the actual reorderable panel itself with class "panel".
   *     var cellPanel=createDivCell().setClass("cell-panel");
   *     var panel=createDiv().setClass("panel");
   *     cellPanel.add(panel);
   *     return cellPanel;
   */
  ,createPanel:function(){
    Ispaces.logger.debug(this.id+'.createPanel()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    ,createDivTable=Create.createDivTable
    ,MOUSEDOWN=_this.Events.MOUSEDOWN
    ,MOUSEUP=_this.Events.MOUSEUP
    ;

    var cellPanel=createDivCell().setClass("cell-panel");

    //cellPanel.panelIndex=panelIndex;
    //cellPanel.id=panelIndex;
    //cellPanel.setBorder(Constants.Borders.RED);
    //cellPanel.setOverflow(Constants.Properties.HIDDEN);
    //cellPanel.setOverflow(Constants.Properties.VISIBLE);
    //cellPanel.setPosition(Constants.Properties.RELATIVE);
    //cellPanel.setMinWidth(1); // Strangely enough, this allows the bottom menu overflow:hidden
    //cellPanel.setMaxWidth(1); // Strangely enough, this allows the bottom menu overflow:hidden
    //cellPanel.setWidthHeightPercent(100);
    //cellPanel.setHeightPercent(100);
    //cellPanel.setPadding('0px');

    /*
     * Set a mousedown event handler on the panel which gets captured first (i.e. the event capturing phase is set to true).
     * This is used to set focus on the panel when grabbing (mousedown) and dragging (mousemove) a file.
     */
    cellPanel.addListener(
      MOUSEDOWN
      ,_this.mouseDownPanelCapturing.bind(_this,cellPanel)
      ,true // Set the event propogation phase to the capturing phase, so that the mousedown event on the panel is processed by this listener first.
    );

    /**
     * Add a mouseup handler, why?
     */
    /*
    cellPanel.addListener(
      MOUSEUP
      ,_this.mouseUpPanelCapturing.bind(_this,cellPanel)
      ,true // Set the event propogation phase to the capturing phase, so that the mousedown event on the panel is processed by this listener first.
    );
    */

    /**
     * @mousedown, @touchstart
     * @mouseup, @touchend
     */
    //cellPanel.addListener(MOUSEDOWN,_this.mouseDownPanel.bind(_this,cellPanel));  // Temporarily removed the reordering of panels for beta 2.0
    //cellPanel.addListener(MOUSEUP,_this.mouseUpPanel.bind(_this,cellPanel));

    //cellPanel.addListener(_this.Events.CONTEXTMENU,_this.showPanelContextMenu.bind(_this));
    cellPanel.addListener(_this.Events.CONTEXTMENU,_this.showContextMenu.bind(_this,"FilePanel"));

    //_this.addDropPanel(cellPanel); // for dnd

    /*
    cellPanel.setAttribute('draggable','true');
    Ispaces.logger.alert(_this.id+'.createPanel('+panelIndex+'): cellPanel.addEventListener(\'drop\',function(){');
    cellPanel.addEventListener('drop',function(e){
      // this/e.target is current target element.
      Ispaces.logger.debug('div.drop()');
      if(e.stopPropagation)e.stopPropagation(); // Stops some browsers from redirecting.
      e.preventDefault();
      var files=e.dataTransfer.files;
      for(var i=0,f;f=files[i];i++) {
        Ispaces.logger.debug('div.drop(): f = '+f);
      }
    },false);
    //*/

    var panel=createDiv().setClass("panel");

    //panel.setBorder(Constants.Borders.GREEN);
    panel.setPosition(Constants.Properties.RELATIVE); // Constants.Properties.HIDDEN
    panel.setWidthHeightPercent(100);
    //panel.setBackground(Constants.Colors.WHITE);
    //panel.setBackground('red');
    //panel.setMinWidth(1); // Strangely enough, this allows the bottom menu overflow:hidden
    //panel.setMaxWidth(1); // Strangely enough, this allows the bottom menu overflow:hidden
    cellPanel.panel=panel;
    //panel.panel=cellPanel;
    panel.cellPanel=cellPanel;
    //Ispaces.logger.debug('panel.cellPanel = '+panel.cellPanel);

    /*
      cellPanel.panel.positionRelative(0);
      cellPanel.panel.setLeftPixels(0);
      cellPanel.panel.setClass('panel'); // Reset the className
      cellPanel.panel.setWidthPixels('');
      cellPanel.setOverflow(Constants.Properties.HIDDEN);
      cellPanel.style.minWidth=_this.Constants.EMPTY; // Remove the min-width setting on the cellPanel
      cellPanel.setOverflow(Constants.Properties.VISIBLE);
      panel.toFront();
      panel.setClass('panel-dragged');
    */

    /*
     * The topbarDiv is set as a property of the panel so it can add the position:absolute when doing a root select.
     */
    var topbarDiv=createDiv();
    cellPanel.topbarDiv=topbarDiv; /// Set a reference to the topbar on the topbarDiv. @see newPanel()

    var topbar=_this.createTopbar(cellPanel);

    //topbar.setBorder(Constants.Borders.RED);
    topbarDiv.topbar=topbar;
    topbar.panel=cellPanel; // Set the panel as a property of the toolbar for quick access.
    topbar.cellPanel=cellPanel; // Set the panel as a property of the toolbar for quick access.

    /*
    //var pathDiv=_this.createPathDiv();
    var colDiv=_this.createColumnHeaders();
    //var divFiles=_this.createDivFiles(o.root);
    //var divFiles=_this.createDivFiles(o);
    //cellPanel.pathDiv=pathDiv;
    cellPanel.colDiv=colDiv;
    //cellPanel.divFiles=divFiles;
    //*/

    //* The first divFiles creation happens after a root has been selected. Removing for now.
    //var divFiles=_this.createDivFiles(o);
    //var divFiles=_this.createDivFiles();
    //var divFiles=Create.createDivCell();
    //var divFiles=createDivTable().setClass("files");
    //var divFiles=Create.createDiv().setClass("files");
    //var divFiles=Create.createDivCell().setClass("files");
    var cellFiles=Create.createDivCell().setClass("cell-files");

    //cellFiles.setOverflow(Constants.Properties.AUTO);
    //cellFiles.alignTop();

    cellFiles.setDisplay(Constants.Properties.INLINEBLOCK);
    //cellFiles.setDisplay(Constants.Properties.INLINETABLE);
    //divFiles.di(Constants.Properties.INLINETABLE);
    //divFiles.di(Constants.Properties.INLINEBLOCK);
    //divFiles.setBackground('orange');
    //divFiles.setBorder(Constants.Borders.BLUE);
    //divFiles.setHeightPercent(100);
    //divFiles.setHeightPercent(100);
    //divFiles.setWidthHeightPercent(100);
    //divFiles.setMargin('0');
    //divFiles.alignTop();
    //divFiles.setOverflowX(Constants.Properties.HIDDEN);
    //divFiles.setOverflowY(Constants.Properties.AUTO);
    //divFiles.setOverflow(Constants.Properties.HIDDEN);
    //cellPanel.divFiles=divFiles;
    cellPanel.cellFiles=cellFiles;

    //Ispaces.logger.debug(_this.id+'.createPanel(): divFiles ='+divFiles);
    //*/

    /*
    divFiles.addListener(
      'overflow'
      ,function(e){
        Ispaces.logger.debug('divFiles.setOverflow('+e+')');

        switch(e.detail){
          case 0:
            Ispaces.logger.debug('The vertical scrollbar has appeared.');
            break;
          case 1:
            Ispaces.logger.debug('The horizontal scrollbar has appeared.');
            break;
          case 2:
            Ispaces.logger.debug('The horizontal and vertical scrollbars have both appeared.');
            break;
        }
      }
      ,false
    );
    *.

    /*
    divFiles.addListener(
      Constants.Events.MOUSEWidthHeightEEL
      ,function(e){
        Ispaces.logger.debug('mousewheel('+e+')');
        Ispaces.logger.debug('e.wheelDelta = '+e.wheelDelta);
        Ispaces.logger.debug('e.detail = '+e.detail);
        Ispaces.logger.debug('e.axis = '+e.axis);

        var wheelData=e.detail?e.detail*-1:e.wheelDelta/40;
        Ispaces.logger.debug('wheelData = '+wheelData);

        var raw=e.detail?e.detail:e.wheelDelta;
        var normal=e.detail?e.detail*-1:e.wheelDelta/40;
        Ispaces.logger.debug('Raw Value: '+raw+", Normalized Value: "+normal);

        var delta = 0;
        if(e.wheelDelta){
          delta=e.wheelDelta/120;
        }else if(e.detail){
          delta=-e.detail/3;
        }
        Ispaces.logger.debug('delta = '+delta);

        if(delta!=0){
          _this.scrollTop=_this.scrollTop-delta*10;
        }
        delta=0;

        Common.killEvent(e);

      }
      ,false
    );
    */

    /*
    divFiles.addListener(
      'scroll'
      ,function(e){
        Ispaces.logger.debug('scroll('+e+')');
      }
      ,false
    );
    */

    /*
    divFiles.addListener(
      'underflow'
      ,function(e){
        Ispaces.logger.debug('divFiles.underflow('+e+')');

        switch(e.detail){
          case 0:
            Ispaces.logger.debug('The vertical scrollbar has disappeared.');
            break;
          case 1:
            Ispaces.logger.debug('The horizontal scrollbar has disappeared.');
            break;
          case 2:
            Ispaces.logger.debug('The horizontal and vertical scrollbars have both disappeared.');
            break;
        }
      }
      ,false
    );
    */

    /*
    cellFiles.addListener(
      'overflow'
      ,function(e){
        Ispaces.logger.debug('cellFiles.overflow('+e+')');

        switch(e.detail){
          case 0:
            Ispaces.logger.debug('The vertical scrollbar has appeared.');
            break;
          case 1:
            Ispaces.logger.debug('The horizontal scrollbar has appeared.');
            break;
          case 2:
            Ispaces.logger.debug('The horizontal and vertical scrollbars have both appeared.');
            break;
        }
      }
    );
    cellFiles.addListener(
      'scroll'
      ,function(e){
        Ispaces.logger.debug('cellFiles.scroll('+e+')');
      }
    );
    //*/

    //divFiles.addListener(MOUSEDOWN,_this.mouseDownDivFiles.bind(_this));
    cellFiles.addListener(MOUSEDOWN,_this.mouseDownDivFiles.bind(_this));


    /*
    divFiles.panel=cellPanel; // Set the panel as a property of the divFiles for quick access.
    divFiles.setHeightPixels(333);
    divFiles.setOverflowX(Constants.Properties.HIDDEN);
    divFiles.setOverflowY(Constants.Properties.AUTO);
    //divFiles.borderLeft('#88BBD6 2px solid');
    //divFiles.setBorderRight('#88BBD6 1px solid');
    //divFiles.setBorderRight('0px');
    */

    //*
    //var topbarDiv=Create.createDiv(topbar);
    topbarDiv.add(topbar);
    //topbarDiv.setBorder(Constants.Borders.ORANGE);
    //topbarDiv.setWidthPercent(100);
    //topbarDiv.setHeightPixels(50);
    //topbarDiv.setMaxHeight(50);
    //topbarDiv.setMinHeight(50);
    //topbarDiv.setOverflow(Constants.Properties.VISIBLE);
    //topbarDiv.setPosition(Constants.Properties.RELATIVE);
    //topbarDiv.setPosition(Constants.Properties.ABSOLUTE);
    //*/

    var topbarCell=createDivCell(topbarDiv).setClass("cell-topbar")
    ,topbarRow=createDivRow(topbarCell)
    //,cellFiles=createDivCell(divFiles) // The first divFiles creation happens after a root has been selected, so we no longer pass in the divFiles?
    ,rowFiles=createDivRow(cellFiles)
    //,rowFiles=createDivRow(divFiles)
    ,divTable=createDivTable([
      topbarRow
      ,rowFiles
    ]);

    //var divCell=Create.createDivCell(divTable);
    //panel.add(divCell);
    panel.add(divTable);

    //topbarCell.setBorder(Constants.Borders.YELLOW);
    //topbarCell.setPosition(Constants.Properties.RELATIVE);
    topbarCell.setOverflow(Constants.Properties.VISIBLE);
    //topbarCell.setPosition(Constants.Properties.ABSOLUTE);
    //topbarCell.setHeightPixels(35);
    //topbarCell.setHeightPixels(42);
    //topbarCell.setHeightPixels(50);
    //topbarCell.setMaxHeight(50);
    //topbarCell.setMinHeight(50);
    //topbarCell.setWidthPercent(100);
    //topbarCell.setHeightPercent(1);
    //topbarCell.bottomPadding('8px');
    //topbarCell.setPadding('3px');
    //topbarCell.setPadding('8px'); // We can either set the padding on the topbar cell itself or on the whole file panel below.
    //topbarCell.setPadding('8px 8px 0px 8px'); // We can either set the padding on the topbar cell itself or on the whole file panel below.


    //divFiles.setBackground('green');
    //cellFiles.setBackground('green');
    //cellFiles.setBorder(Constants.Borders.WHITE);
    cellPanel.cellFiles=cellFiles;
    //cellPanel.cellFiles=divFiles; // Switching divFiles to cellFiles or vice versa
    cellPanel.divTable=divTable; // @see clearMovingTo()
    cellPanel.rowFiles=rowFiles;

    //rowFiles.setHeightPercent(100);
    //rowFiles.setMargin('0');

    //divTable.setPosition(Constants.Properties.RELATIVE);
    //divTable.setPadding('8px');
    divTable.setWidthHeightPercent(100);
    //divTable.setMargin(Constants.Characters.ZERO);
    //divTable.setPadding(Constants.Characters.ZERO);
    //divTable.alignCenterMiddle();
    //divTable.setBorder(Constants.Borders.YELLOW);

    //divCell.setBorder(Constants.Borders.BLUE);
    //divCell.setPadding('8px'); // We can either set the padding on the whole cell, or on the individual cells above.
    //divCell.setWidthHeightPercent(100);

    /*
    panel.addAll([
      //topbar
      topbarRow
      //,toolbar
      //,pathDiv
      //,colDiv
      //,divFiles
    ]);
    //*/


    /*
    // http://www.html5rocks.com/en/tutorials/dnd/basics/
    var dragSrcEl=null;
    panel.setAttribute('draggable','true');
    panel.addEventListener('dragstart',function(e){
      Ispaces.logger.debug('handleDragStart');
      this.style.opacity = '0.4';  // this / e.target is the source node.
      dragSrcEl=this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    },false);
    panel.addEventListener('dragenter',function(){Ispaces.logger.debug('handleDragEnter')},false)
    panel.addEventListener('dragover',function(e){
      Ispaces.logger.debug('handleDragOver');
      if (e.preventDefault)e.preventDefault(); // Necessary. Allows us to drop.
      e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
      return false;
    },false);
    panel.addEventListener('dragleave',function(e){Ispaces.logger.debug('handleDragLeave')},false);
    panel.addEventListener('drop',function(e){Ispaces.logger.debug('handleDrop')},false);
    panel.addEventListener('dragend',function(e){Ispaces.logger.debug('handleDragEnd')},false);
    panel.addEventListener('drop',function(e){
      // this/e.target is current target element.
      Ispaces.logger.debug('panel.drop()');
      if(e.stopPropagation)e.stopPropagation(); // Stops some browsers from redirecting.
      e.preventDefault();
      var files=e.dataTransfer.files;
      if(files){
        for(var i=0,f;f=files[i];i++) {
          Ispaces.logger.debug('panel.drop(): f = '+f);
          Ispaces.logger.debug('panel.drop(): f.name = '+f.name+', f.type = '+f.type+', f.size = '+f.size);
          Ispaces.logger.debug("panel.drop(): f.name = "+f.name+", f.type = "+f.type+", f.size = "+f.size);
          Ispaces.logger.debug("panel.drop(): f['name'] = "+f['name']+", f['type'] = "+f['type']+", f['size'] = "+f['size']);
          if(f.lastModifiedDate)Ispaces.logger.debug('panel.drop(): f.lastModifiedDate.toLocaleDateString() = '+f.lastModifiedDate.toLocaleDateString());
        }
      }
      Ispaces.logger.debug('panel.drop(): dragSrcEl = '+dragSrcEl);
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

    cellPanel.add(panel);

    return cellPanel;
  }

  ,createCenterGrabber:function(){
    //Ispaces.logger.debug(this.id+'.createCenterGrabber()');

    var _this=this
    ,Create=_this.Create
    ,Events=_this.Events
    ,MOUSEMOVE=Events.MOUSEMOVE
    ,grabby=Create.createDiv().setClass("grabby")
    ,div=Create.createDivCell(grabby).setClass("center")
    ;

    var newLeftWidth,newRightWidth;

    div.addListener(

      Events.MOUSEDOWN // can be mousedown or touchstart

      ,function(e){
        Ispaces.logger.debug(_this.id+'.createCenterGrabber(): div.mouseDown('+e+')');

        //Common.stopEventPropagation(e); // Prevent the drag from doing a selection.
        Common.killEvent(e); // Prevent the drag from doing a selection.

        if(!_this.resizePanelFunction){

          //Ispaces.global.mouseUpObject=_this; // Global catch-all object.
          Common.setMouseUpObject(_this); // Global catch-all object.

          var applicationWidthHeight=Common.getWidthHeight(_this.divApplication);
          Ispaces.logger.debug("applicationWidthHeight = "+applicationWidthHeight);

          //var mouseDownX=e.pageX;
          var mouseDownX=Common.getMouseX(e); // Use getMouseX() here instead of e.pageX as this function can handle touch as well.
          Ispaces.logger.debug("mouseDownX = "+mouseDownX);

          var panelLeft=this.previousSibling // this = center grabber div
          ,panelRight=this.nextSibling       // this = center grabber div
          ,panelLeftWidth=Common.getWidth(panelLeft)
          ,panelRightWidth=Common.getWidth(panelRight)
          ;

          Ispaces.logger.debug('panelLeftWidth = '+panelLeftWidth+', panelRightWidth = '+panelRightWidth);

          // Important - Before resizing colums, the enclosing panelCells needs overflow:hidden for the center column resizing to work.
          panelLeft.setOverflow(Constants.Properties.HIDDEN);
          panelRight.setOverflow(Constants.Properties.HIDDEN);

          /*
          var divFilesLeft=panelLeft.divFiles;
          var divFilesRight=panelRight.divFiles;
          divFilesLeft.w=Common.getWidth(divFilesLeft);
          divFilesRight.w=Common.getWidth(divFilesRight);
          //*/
          var cellFilesPanelLeft=panelLeft.cellFiles;
          var cellFilesPanelRight=panelRight.cellFiles;

          /*
           * When resizing using the center grabber, the topbarDiv width must be 100% so it resizes with the panel.
           */
          var topbarDivLeft=panelLeft.topbarDiv;
          var topbarDivRight=panelRight.topbarDiv;
          //Ispaces.logger.debug(this.id+'.createCenterGrabber(): topbarDivLeft = '+topbarDivLeft);
          //Ispaces.logger.debug(this.id+'.createCenterGrabber(): topbarDivRight = '+topbarDivRight);
          topbarDivLeft.setPosition('relative');
          topbarDivLeft.setWidthPercent(100);
          topbarDivRight.setPosition('relative');
          topbarDivRight.setWidthPercent(100);

          Common.addListener(
            document
            ,MOUSEMOVE
            ,_this.resizePanelFunction=function(e){

              var mouseX=Common.getMouseX(e)
              ,mouseMovedX=(mouseX-mouseDownX)
              ;

              //Ispaces.logger.debug('mouseX = '+mouseX+', mouseMovedX = '+mouseMovedX);

              newLeftWidth=panelLeftWidth+mouseMovedX
              ,newRightWidth=panelRightWidth-mouseMovedX
              ;

              //Ispaces.logger.debug('newLeftWidth = '+newLeftWidth+', newRightWidth = '+newRightWidth);
              //Ispaces.logger.debug('mouseX = '+mouseX+', mouseMovedX = '+mouseMovedX+', newLeftWidth = '+newLeftWidth+', newRightWidth = '+newRightWidth);

              if(newLeftWidth<0){

                //panelLeft.setWidthPixels(0),panelLeft.setMaxWidth(0),divFilesLeft.setWidthPixels(0); // maWi() allows the overflow to work.
                //panelLeft.setWidthPixels(0),panelLeft.setMaxWidth(0);//,divFilesLeft.setWidthPixels(0); // maWi() allows the overflow to work.
                //panelLeft.fixedWidth(0);

                //panelRight.setWidthPixels(panelLeftWidth+panelRightWidth),panelRight.setMaxWidth(panelLeftWidth+panelRightWidth);
                panelRight.fixedWidth(panelLeftWidth+panelRightWidth);

              } else if(newRightWidth<0){

                //panelLeft.setWidthPixels(panelLeftWidth+panelRightWidth),panelLeft.setMaxWidth(panelLeftWidth+panelRightWidth);
                //panelLeft.setWidthPixels(panelLeftWidth+panelRightWidth);//,panelLeft.setMaxWidth(panelLeftWidth+panelRightWidth);
                panelLeft.fixedWidth(panelLeftWidth+panelRightWidth);

                //panelRight.setWidthPixels(0),panelRight.setMaxWidth(0),divFilesRight.setWidthPixels(0);
                //panelRight.setWidthPixels(0);//,panelRight.setMaxWidth(0),divFilesRight.setWidthPixels(0);
                panelRight.fixedWidth(0);

              }else{

                /*
                //panelLeft.setWidthPixels(newLeftWidth),panelLeft.setMaxWidth(newLeftWidth),divFilesLeft.setWidthPixels(divFilesLeft.w+mouseMovedX);
                panelLeft.fixedWidth(newLeftWidth)
                ,divFilesLeft.setWidthPixels(divFilesLeft.w+mouseMovedX)
                ;

                //panelRight.setWidthPixels(newRightWidth),panelRight.setMaxWidth(newRightWidth),divFilesRight.setWidthPixels(divFilesRight.w-mouseMovedX);
                panelRight.fixedWidth(newRightWidth)
                ,divFilesRight.setWidthPixels(divFilesRight.w-mouseMovedX)
                ;
                */

                panelLeft.fixedWidth(newLeftWidth);
                panelRight.fixedWidth(newRightWidth);
                //panelLeft.setWidthPixels(newLeftWidth);
                //panelRight.setWidthPixels(newRightWidth);

                cellFilesPanelLeft.fixedWidth(newLeftWidth);
                cellFilesPanelRight.fixedWidth(newRightWidth);

                //_this.adjustPanels(applicationWidthHeight[0]);  // Call adjustPanels() on this FileManager object.
                /*
                if(isTree){
                  panelLeft.divFiles.setWidthPixels(newWidth);
                }else{

                  if(cellPanel.tbody){
                    Ispaces.logger.debug('cellPanel.tbody.setWidthPixels('+newWidth+')');
                    cellPanel.tbody.setWidthPixels(newWidth);
                    //cellPanel.tbody.setOverflow('scroll');
                    //cellPanel.tbody.di('block');
                  }

                }
                //*/

                // Might be a way to combine these two... polymorphic e.g. panelLeft.resizable
                if(panelLeft.tbody)panelLeft.tbody.setWidthPixels(newLeftWidth);
                if(panelRight.tbody)panelRight.tbody.setWidthPixels(newRightWidth);

                if(panelRight.unorderedList)panelRight.unorderedList.setWidthPixels(newRightWidth);
                if(panelLeft.unorderedList)panelLeft.unorderedList.setWidthPixels(newLeftWidth);

              }

            }
          );

        } // if(!_this.resizePanelFunction)

        return false; // Prevent the mouse down from initiating a selection.
      }
    );

    div.addListener(
      Events.MOUSEUP // mouseup or touchend
      ,function(e){
        //Ispaces.logger.debug(this.id+'.createCenterGrabber(): div.mouseUp('+e+')');

        //Ispaces.logger.debug('newLeftWidth = '+newLeftWidth+', newRightWidth = '+newRightWidth);

        var panelLeft=this.previousSibling
        ,panelRight=this.nextSibling
        ,panelLeftWidth=Common.getWidth(panelLeft)
        ,panelRightWidth=Common.getWidth(panelRight)
        ;

        //Ispaces.logger.debug('panelLeft = '+panelLeft);
        //Ispaces.logger.debug('panelRight = '+panelRight);

        /*
        // Important - When done resizing columns, the enclosing panel needs overflow:visible for the relative positioning to work when draggin panelCells.
        panelLeft.setOverflow(Constants.Properties.VISIBLE);
        panelRight.setOverflow(Constants.Properties.VISIBLE);
        //*/


        //Ispaces.logger.debug("panelLeftWidth = "+panelLeftWidth);
        //Ispaces.logger.debug("panelRightWidth = "+panelRightWidth);

        //var panelLeftWidthHeight=Common.getWidthHeight(panelLeft);
        //var panelRightWidthHeight=Common.getWidthHeight(panelRight);

        //Ispaces.logger.debug("panelLeftWidthHeight = "+panelLeftWidthHeight);
        //Ispaces.logger.debug("panelRightWidthHeight = "+panelRightWidthHeight);

        panelLeft._width=panelLeftWidth;   // Set the new width as a property of the panel itelf.
        panelRight._width=panelRightWidth; // Set the new width as a property of the panel itelf.

        if(_this.resizePanelFunction){

          Common.removeListener(
            document
            ,MOUSEMOVE
            ,_this.resizePanelFunction
          );
          _this.resizePanelFunction=null;

          _this.resetPositions(); // for dnd
        }
      }
    );

    return div;
  }

  ,createDivFiles:function(o){
    Ispaces.logger.debug(this.id+'.createDivFiles(o:'+o+')');
    //Ispaces.logger.debug(this.id+'.createDivFiles()');

    //var div=this.Create.createElement(Constants.Tags.DIV).setClass('files');
    var div=this.Create.createDiv().setClass("files");

    /*
    var o={};
    o.filesDiv=div;
    //o.filesDiv.left=o.left; // This is so we can set the selected root in the UI @see createFileUnorderedList:function(root,path,fileMap,filesDiv).

    // Asyncronously add the file listing, so that the UI can continue to be shown.
    //var call=new Ispaces.AsyncApply(this,"addDivFiles",[div,o.root],3);
    //AsyncApply.exec(new Ispaces.AsyncApply(this,"addDivFiles",[o],3));
    //this.addDivFiles(o);
    */

    div.setOverflowX(Constants.Properties.HIDDEN);
    div.setOverflowY(Constants.Properties.AUTO);

    return div;
  }

  /*
   * The topbar contains the panel repositioning functionality.
   * @param x the id of this panel.
   * @param panel The panel being created is passed in here, so the drag handle can be added to it for reference.
   */
  ,createTopbar:function(cellPanel){
    Ispaces.logger.debug(this.id+'.createTopbar(cellPanel:'+cellPanel+')');

    var _this=this

    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    ,createDivTable=Create.createDivTable
    ,createTextNode=Create.createTextNode

    ,Events=_this.Events
    ,MOUSEDOWN=Events.MOUSEDOWN
    ,MOUSEUP=Events.MOUSEUP

    ,panelDraggable=cellPanel.panel
    ,topbarDiv=cellPanel.topbarDiv
    ;

    //Ispaces.logger.debug('panelDraggable = '+panelDraggable);
    //Ispaces.logger.debug('topbarDiv = '+topbarDiv);

    var config={
      topbarDiv:topbarDiv
      ,firstTime:true
      //,panelIndex:panelIndex
      ,cellPanel:cellPanel
    };

    //new Ispaces.AsyncApply(_this,_this.addRoots,[config],1); // Asyncronously add the root listing, so that the UI can continue to be built and shown.
    var rootUnorderedList=_this.createListRoots(config);

    //var cellRoots=createDivCell(rootUnorderedList).setClass("cell-roots"); // Naming?
    var cellRoots=createDivCell(rootUnorderedList).setClass("cell-roots"); // Naming?
    //var cellUnorderedListRoots=createDivCell(rootUnorderedList).setClass("cell-roots"); // Naming?

    rootUnorderedList.cellRoots=cellRoots; // for root recreation
    cellPanel.rootUnorderedList=rootUnorderedList; // Set a reference to the rootUnorderedList on the cellPanel. @see divTable.ocButton().
    cellPanel.cellRoots=cellRoots; // for root recreation

    //cellRoots.setBorder(Constants.Borders.BLUE);
    //rootUnorderedList.setBorder(Constants.Borders.RED);
    //rootUnorderedList.mdmu(function(e){Common.stopEventPropagation(e)}); // prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler

    /*
     * Prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler.
     */
    rootUnorderedList.addListener(MOUSEDOWN,function(e){Common.stopEventPropagation(e)});
    rootUnorderedList.addListener(MOUSEUP,function(e){Common.stopEventPropagation(e)});

    /*
     * Views
     */
    var cellViews=this.createViewMenuCell(cellPanel); // Pass the cellPanel here
    var rowViews=createDivRow(cellViews).setClass("row-views");

    var viewTable=createDivTable([
      //createDivRow(viewMenuTable)
      rowViews
    ]).setClass("table-views");

    //var spacerCell=createDivCell(createTextNode(panelIndex));
    //var spacerCell=createDivCell(createTextNode(Constants.Characters.NBSP));
    var spacerCell=createDivCell(viewTable).setClass("cell-spacer");

    //var spacerCell=createDivCell();
    //spacerCell.setBorder(Constants.Borders.WHITE);
    Ispaces.logger.warn('Temporary for development @see newPanel()');
    cellPanel.dragCell=spacerCell; // temporary for development @see newPanel()


    /*
     * New panel button
     */
    //var divNewPanel=createDiv(createTextNode(Common.unicode(74))).setClass('button')
    var divNewPanel=createDiv(createTextNode('J')).setClass("button")
    ,newPanelCell=createDivCell(divNewPanel).setClass("cell-button")
    ;

    divNewPanel.addListener(Events.CLICK,_this.newPanel.bind(_this,cellPanel)); // can be click or touchend

    /*
     * Prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler.
     */
    divNewPanel.addListener(MOUSEDOWN,function(e){Common.stopEventPropagation(e)});
    divNewPanel.addListener(MOUSEUP,function(e){Common.stopEventPropagation(e)});

    var rowButtons=createDivRow([
      //viewCell
      newPanelCell
      //,cellRefresh
      //,cellClose
    ]);

    var tableButtons=createDivTable(rowButtons).setClass("table-buttons")
    ,cellButtons=createDivCell(tableButtons).setClass("cell-buttons")
    ;

    var divRow=createDivRow([
      cellRoots
      ,spacerCell
      ,cellButtons
    ]);

    var divTable=createDivTable(divRow).setClass("topbar");

    divTable.cellPanel=cellPanel;
    divTable.div=panelDraggable;

    divTable.setWidthPercent(100);
    viewTable.hide(); // The view selector is initially hidden and gets shown when a root is selected.

    cellPanel.viewTable=viewTable; // The view selector is initially hidden and gets shown when a root is selected.

    return divTable;
  }

  //,createViewMenuCell:function(){
  ,createViewMenuCell:function(cellPanel){
    Ispaces.logger.debug(this.id+'.createViewMenuCell('+cellPanel+')');

    var _this=this
    ,Create=_this.Create
    ,createTextNode=Create.createTextNode
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivTable=Create.createDivTable
    ;

    //var tbodyViews=_this.createTbodyViews();
    var tbodyViews=_this.createTbodyViews(cellPanel);
    //var tableMenu=Create.createTable(tbodyViews).setClass("add-contact");
    var tableMenu=Create.createTable().add(tbodyViews).setClass("views");

    //var cellIcon=createDivCell(createDiv(createTextNode('M'))).setClass("icon-cell")
    //var cellIcon=createDivCell(createDiv(tableMenu)).setClass("icon-cell")
    var cellIcon=createDivCell(tableMenu).setClass("icon-cell")

    //,divArrow=createDiv(createTextNode('6')).setClass("down")
    //,cellArrow=createDivCell(divArrow).setClass("cell-down")

    ,buttonViews=createDivTable(
      Create.createDivRow([
        cellIcon
        //,cellArrow
      ])
    //).setClass("button unicode")
    //).setClass("button")
    ).setClass("drop-down");

    //,cellMenuViews=createDivCell(buttonViews).setClass('button-cell')

    var cellMenuViews=createDivCell([
      buttonViews
      //,tableMenu
    //]).setClass("buttons");
    ]).setClass("drop-down-cell");

    buttonViews.tbodyViews=tbodyViews;
    //buttonViews.cellMenuViews=cellMenuViews;
    //buttonViews.addListener(_this.Events.MOUSEDOWN,_this.mouseDownButtonViews.bind(_this));
    //buttonViews.addListener(_this.Events.MOUSEDOWN,_this.mouseDownButtonViews.bind(_this,buttonViews));
    buttonViews.addListener(
      _this.Events.MOUSEDOWN
      ,_this.mouseDownButtonViews.bind(_this,buttonViews)
      ,true // Set the event captuting phase to capturing (not bubbling) so we can cancel the event and prevent a view selection when simply opening the selection. @see mouseDownView()
    );

    buttonViews.setPosition(Constants.Properties.ABSOLUTE);
    cellMenuViews.setPosition(Constants.Properties.RELATIVE);

    return cellMenuViews;
  }

  ,mouseDownButtonViews:function(
    buttonViews
    ,e
  ){
    Ispaces.logger.debug(this.id+'.mouseDownButtonViews(buttonViews:'+buttonViews+', e:'+e+')');

    //var cellMenuViews=buttonViews.cellMenuViews;
    var tbodyViews=buttonViews.tbodyViews;

    Ispaces.logger.debug(this.id+'.mouseDownButtonViews(): tbodyViews = '+tbodyViews);

    if(tbodyViews.showing){

      tbodyViews.showing=false;
      tbodyViews.hideAll();
      //tbodyViews.firstChild.show();
      //cellMenuViews.setClass("drop-down");
      buttonViews.setClass("drop-down");

    }else{

      tbodyViews.showing=true;
      tbodyViews.showAll();
      //cellMenuViews.setClass("drop-down-on");
      buttonViews.setClass("drop-down-on");
      //tbodyViews.childNodes[0].show();
      buttonViews.toFrontModals();

      /*
      var escape=function(){
        tbodyViews.hideAll();
        tbodyViews.showing=false;
        buttonViews.setClass("drop-down");
      };
      tbodyViews.escape=escape;
      //menu.escape=this.menuClick.bind(this,menu,button)
      //Ispaces.global.escapeObject=menu;
      Ispaces.global.escapeMouseDownObject=tbodyViews;
      Ispaces.global.escapeKeyObject=tbodyViews;
      */

      Common.stopEventPropagation(e); // Prevent the event from selecting a view.
      Common.killEvent(e); // Prevent the event from selecting a view.
      return false;
    }

    //var table=tbodyViews.parentNode;
    //table.toFrontModals();
  }

  /**
   * Create the view selector menu as a tbody element for insertion into the view table menu.
   * There are currently 4 views implemented: Tree, Flat, Tile and List.
   */
  ,createTbodyViews:function(cellPanel){
    Ispaces.logger.debug(this.id+'.createTbodyViews('+cellPanel+')');

    var _this=this
    ,Create=_this.Create
    ,createTextNode=Create.createTextNode
    ,createTableCell=Create.createTableCell
    ,createTableRow=Create.createTableRow
    ;

    var menuViews=_this.menuViews
    ,tbodyViews=tbodyViews=Create.createElement(_this.Constants.TBODY);
    ;

    //Common.required("Svg",true);

    var Svg=Ispaces.Svg;

    /*
     * Flat
     */
    var x1=0
    ,ySpacing=3
    ,x2=28
    ,strokeWidth=3
    ;
    //var createViewIconFlat=Svg.createHorizontalLines.bind(Svg,x1,ySpacing,x2,strokeWidth);
    var viewIconFlat=Svg.createHorizontalLines(x1,ySpacing,x2,strokeWidth);
    /*
    Ispaces.logger.debug('viewIconFlat.viewBox = '+viewIconFlat.viewBox);
    Ispaces.logger.debug('viewIconFlat.viewBox.baseVal = '+viewIconFlat.viewBox.baseVal);
    Ispaces.logger.debug('viewIconFlat.viewBox.baseVal.x = '+viewIconFlat.viewBox.baseVal.x);
    Ispaces.logger.debug('viewIconFlat.viewBox.baseVal.y = '+viewIconFlat.viewBox.baseVal.y);
    Ispaces.logger.debug('viewIconFlat.viewBox.baseVal.width = '+viewIconFlat.viewBox.baseVal.width);
    Ispaces.logger.debug('viewIconFlat.viewBox.baseVal.height = '+viewIconFlat.viewBox.baseVal.height);
    */

    /*
     * List
     */
    //var viewIconList=Svg.createListIcon(); // Not ready for beta 2.0.

    /*
     * Tree
     */
    x1=7
    ,ySpacing=8
    ,x2=16
    ,strokeWidth=1
    ;
    //var viewIconTree=Svg.createTreeIcon(x1,ySpacing,x2,strokeWidth);
    var viewIconTree=Svg.createTreeIcon();
    //var viewIconTile=Svg.createTreeIcon(x1,ySpacing,x2,strokeWidth);

    /*
     * Tile
     */
    var viewIconTile=Svg.createTileIcon();

    /*
    Ispaces.logger.debug('viewIconTree.viewBox = '+viewIconTree.viewBox);
    Ispaces.logger.debug('viewIconTree.viewBox.baseVal.x = '+viewIconTree.viewBox.baseVal.x);
    Ispaces.logger.debug('viewIconTree.viewBox.baseVal.y = '+viewIconTree.viewBox.baseVal.y);
    Ispaces.logger.debug('viewIconTree.viewBox.baseVal.width = '+viewIconTree.viewBox.baseVal.width);
    Ispaces.logger.debug('viewIconTree.viewBox.baseVal.height = '+viewIconTree.viewBox.baseVal.height);
    //*/

    var viewsArray=[
      ["tree",'|',viewIconTree,true] // true = default - hardcoded for beta 2.0
      ,["flat",']',viewIconFlat]
      //,["list",'[',viewIconList]
      ,["tile",'\\',viewIconTile]
    ]
    ,viewsArrayLength=viewsArray.length
    ,view
    ,viewName
    ,i
    ,charIcon
    ,tableCellText
    ,tableRow
    ,tableRowDefault
    //,TOUCHSTART=Constants.Events.TOUCHSTART
    ,MOUSEDOWN=Constants.Events.MOUSEDOWN
    ;

    //Ispaces.logger.debug('viewsArray = '+viewsArray);
    //Ispaces.logger.debug('viewsArray.length = '+viewsArray.length);

    for(i=0;i<viewsArrayLength;i++){

      view=viewsArray[i]
      ,viewName=view[0]
      ,charIcon=view[1]
      ,svgIcon=view[2]
      ,isDefault=view[3]
      ;
      //txt=view+'';

      /*
      var svgLines=Ispaces.Svg.createHorizontalLines(x1,ySpacing,x2,strokeWidth);
      Ispaces.logger.debug('svgLines = '+svgLines);
      Ispaces.logger.debug('svgLines.width = '+svgLines.width);
      Ispaces.logger.debug('Common.getWidthHeight(svgLines) = '+Common.getWidthHeight(svgLines));
      Ispaces.logger.debug('svgLines.getAttribute(\'width\') = '+svgLines.getAttribute('width'));
      //Ispaces.logger.debug('svgLines.getBBox().width = '+svgLines.getBBox().width); // NS_ERROR_FAILURE: Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIDOMSVGLocatable.getBBox]
      Ispaces.logger.debug('svgLines.getBoundingClientRect().width = '+svgLines.getBoundingClientRect().width);
      */

      //tableCellText=Create.createTableCell(Create.createTextNode(txt)).setClass('text')
      //tableCellText=createTableCell(createTextNode(charIcon))
      //tableCellText=createTableCell(svgLines)
      tableCellText=createTableCell(svgIcon)
      ,tableRow=createTableRow(tableCellText)
      ;

      var totalHeight=svgIcon.totalHeight;
      var totalWidth=svgIcon.totalWidth;
      //Ispaces.logger.debug('totalWidth = '+totalWidth+', totalHeight = '+totalHeight);

      if(totalHeight){
        svgIcon.setWidthHeightPixels(totalWidth,totalHeight);
      }else{
        svgIcon.setWidthHeightPixels(30,25);
      }

      //svgIcon.setBorder(Constants.Borders.RED);
      svgIcon.alignCenterMiddle();
      tableCellText.setMinWidthHeight(38,29);
      tableCellText.alignCenterMiddle();

      //tableRow.view=view;
      tableRow.viewName=viewName;
      if(isDefault){
        tableRow.show();
        tableRowDefault=tableRow;
      }else{
        tableRow.hide();
      }

      //tableRow.addListener(MOUSEDOWN,_this.mouseDownView.bind(_this,tableRow));
      tableRow.addListener(MOUSEDOWN,_this.mouseDownView.bind(_this,tableRow,cellPanel));

      tbodyViews.add(tableRow);
    }

    //_this.tbodyViews=tbodyViews;
    //tbodyViews.childNodes[0].show();
    tbodyViews.addFirst(tableRowDefault);

    return tbodyViews;

    menuViews.replaceFirst(tbodyViews);

    if(menuViews.showing){

      menuViews.hide();
      menuViews.showing=false;

      //Ispaces.global.escapeObject=null;
      Common.setEscapeObject(null);

    }else{

      menuViews.show();
      menuViews.toFrontModals();
      menuViews.showing=true;

    }

    //Ispaces.global.escapeKeyObject=menuViews;
    //Ispaces.global.escapeObject=menuViews;
    //Ispaces.global.escapeKeyObject=menuViews;
    //Ispaces.global.escapeObject=menuViews; // TBD - The escape seems to be closing the select on click before it is shown.
    //*/
  }

  //    tableRow.addListener(MOUSEDOWN,this.mouseDownView.bind(this,tableRow));
  ,mouseDownView:function(
    tableRow
    ,cellPanel
    ,e
  ){
    Ispaces.logger.debug(this.id+'.mouseDownView(tableRow:'+tableRow+', cellPanel:'+cellPanel+', e:'+e+')');

    Common.killEvent(e);
    /*
      '\\' // tree
      ,']' // flat
      ,'[' // list
    */
    /*
    if(tableRow.view=='\\'){
      this.tree();
    }elseif(tableRow.view==']'){
      this.flat();
    //}else if(tableRow.view=='['){ // Not implemented yet.
    //  this.list();
    }
    */

    var viewName=tableRow.viewName;
    Ispaces.logger.debug('viewName = '+viewName);

    var config={
      cellPanel:cellPanel
      ,protocol:cellPanel.protocol
      //,divFiles:cellPanel.divFiles
      ,cellFiles:cellPanel.cellFiles
      //,isLocal:cellPanel.isLocal
      //,refresh:true
    };

    this[viewName](config);

    //tbodyViews.addFirst(tableRow);
    //tableRow.parentNode.addFirst(tableRow); // If we want to switch the chosen view to be the top-most view.
    tableRow.show();
  }

  ,createBottomMenu:function(){
    Ispaces.logger.debug(this.id+'.createBottomMenu()');

    /*
     * DOM
     */
    var _this=this // local reference to the 'this' object for obfuscation performance
    ,Create=_this.Create // local reference to the 'Create' object for speed
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    //,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n


    /*
     * Copy
     */
    ,buttonCopy=createDiv(createTextNodeI18n("Copy")).setClass("button copy")
    ,copyCell=createDivCell(buttonCopy).setClass("cell-button")

    /*
     * Move
     */
    //,buttonMove=createDiv(createTextNodeI18n("Move")).setClass("button move")
    //,moveCell=createDivCell(buttonMove).setClass("cell-button")

    /*
     * New Folder
     */
    ,buttonNewFolder=createDiv(createTextNodeI18n("New Folder")).setClass("button new-folder")
    ,newFolderCell=createDivCell(buttonNewFolder).setClass("cell-button")

    /*
     * Delete
     */
    ,buttonDelete=createDiv(createTextNodeI18n("Delete")).setClass("button delete")
    ,deleteCell=createDivCell(buttonDelete).setClass("cell-button")

    ,buttonRow=Create.createDivRow([
      copyCell
      //,moveCell
      ,newFolderCell
      ,deleteCell
    ])

    ,buttonTable=Create.createDivTable(buttonRow).setClass("table-buttons")

    ;

    /*
     * Style
     */
    /*
    //buttonCopy.di('table-cell');
    copyCell.alignCenterMiddle();
    copyCell.setWidthPercent(1);

    //buttonMove.di('table-cell');
    moveCell.alignCenterMiddle();
    moveCell.setWidthPercent(1);

    //buttonNewFolder.di('table-cell');
    newFolderCell.alignCenterMiddle();
    newFolderCell.setWidthPercent(1);

    //buttonDelete.di('table-cell');
    deleteCell.alignCenterMiddle();
    deleteCell.setWidthPercent(1);
    */

    buttonTable.setWidthPercent(1);
    //buttonTable.setBorder(Constants.Borders.RED);
    buttonTable.alignCenterMiddle();
    buttonTable.setOverflow(Constants.Properties.HIDDEN);

    /*
     * Events
     */
    var CLICK=_this.Events.CLICK;

    buttonCopy.addListener(CLICK,_this.clickCopy.bind(_this));
    //buttonMove.addListener(CLICK,_this.clickMove.bind(_this));
    buttonNewFolder.addListener(CLICK,_this.newFolder.bind(_this));
    buttonDelete.addListener(CLICK,_this.clickDelete.bind(_this));

    /*
     * Prevent the mousedown/mouseup event from selecting the text on the button. Is there a better way? CSS = user-select:none
     */
    /*
    buttonCopy.addListener(
      _this.Events.MOUSEDOWN
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );

    buttonCopy.addListener(
      _this.Events.MOUSEUP
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );

    buttonMove.addListener(
      _this.Events.MOUSEDOWN
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );

    buttonMove.addListener(
      _this.Events.MOUSEUP
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );

    buttonNewFolder.addListener(
      _this.Events.MOUSEDOWN
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );

    buttonNewFolder.addListener(
      _this.Events.MOUSEUP
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );

    buttonDelete.addListener(
      _this.Events.MOUSEDOWN
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );

    buttonDelete.addListener(
      _this.Events.MOUSEUP
      ,function(e){Common.stopEventPropagation(e)}
      ,false
    );
    */

    /*
     * Progress
     */
    /*
    var _this=this;
    var divProgress=_this.Create.createDiv(_this.Create.createTextNode('Progress')).setClass('button progress');
    //divProgress.oc(_this.progress.bind(_this));
    //divProgress.ocButton(_this.del.bind(_this));
    divProgress.addListener(
      _this.Events.CLICK
      //,_this.progress.bind(_this)
      ,function(){

        Ispaces.logger.debug('_this.progressCall = '+_this.progressCall);

        //if(!_this.progressCall){
          //Ispaces.logger.debug('_this.progressCall=new Ispaces.AsyncCall()');
          _this.progressCall=new Ispaces.AsyncCall(
            _this
            ,"progress"
            //,_this.progress
            //,_this.PROGRESS_WAIT // If after this.PROGRESS_WAIT seconds the copy is not completed (and this asynchronous call cancelled), call the progress function.
            ,0
          );
        //}

      }
      ,false
    );
    //divProgress.mdmu(function(e){Common.stopEventPropagation(e)}); // prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler
    divProgress.di('table-cell');

    var progressCell=_this.Create.createDivCell(divProgress);
    progressCell.setClass('button-cell');
    progressCell.alignCenterMiddle();
    progressCell.setWidthPercent(1);

    buttonRow.add(progressCell);
    //*/


    //return buttonTable;

    //var buttonCell=_this.Create.createDivCell(buttonTable);
    //buttonCell.setWidthPercent(1);

    /*
    //var div=_this.Create.createDiv(menuDivTable).setClass('bottom');
    var div=_this.Create.createDiv(buttonTable).setClass('bottom');
    //div.setBorder(Constants.Borders.BLUE);
    div.alignCenterMiddle();

    return div;
    */
    return Create.createDiv(buttonTable).setClass("bottom");
  }


  /*
   * Actions
   */

  ,newPanel:function(cellPanel){
    Ispaces.logger.debug(this.id+'.newPanel('+cellPanel+')');

    var _this=this;

    //Ispaces.logger.debug('Common.getWidth(_this.divApplication) = '+Common.getWidth(_this.divApplication));  // Compare the divMain to the divApplication for curiosity. They should be the same.
    //Ispaces.logger.debug('Common.getWidth(_this.divMain) = '+Common.getWidth(_this.divMain));
    //var totalWidth=Common.getWidth(_this.divMain);
    var totalWidth=Common.getWidth(_this.divApplication);
    Ispaces.logger.debug('totalWidth = '+totalWidth);

    var newPanel=_this.createPanel();  // Create the new panel.

    var panelCells=_this.panelCells;

    panelCells.push(newPanel);  // Add the new cellPanel to the array.

    var panelCellsLength=panelCells.length;

    //_this.panelRow.addAfter(newPanel,cellPanel);
    //_this.panelRow.addAfter(_this.createCenterGrabber(),cellPanel);

    //_this.panelCells.forEach(function(cellPanel){Common.unsetWidth(cellPanel)});

    var totalGrabberWidth=(panelCellsLength-1)*this.grabberWidth; // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    Ispaces.logger.debug('totalGrabberWidth = '+totalGrabberWidth);

    var panelsWidth=totalWidth-totalGrabberWidth; // Adjust the width for the center grabbers.
    Ispaces.logger.debug('panelsWidth = '+panelsWidth);

    /*
    Ispaces.logger.debug('(panelsWidth/panelCellsLength) = '+(panelsWidth/panelCellsLength));
    Ispaces.logger.debug('Math.round((panelsWidth/panelCellsLength)) = '+Math.round((panelsWidth/panelCellsLength)));
    Ispaces.logger.debug('(panelsWidth/panelCellsLength).toFixed(4) = '+(panelsWidth/panelCellsLength).toFixed(4));
    Ispaces.logger.debug('(panelsWidth/panelCellsLength).toFixed(2) = '+(panelsWidth/panelCellsLength).toFixed(2));
    Ispaces.logger.debug('(panelsWidth/panelCellsLength).toFixed() = '+(panelsWidth/panelCellsLength).toFixed());
    Ispaces.logger.debug('Math.round((panelsWidth/panelCellsLength).toFixed(4)) = '+Math.round((panelsWidth/panelCellsLength).toFixed(4)));
    */

    //var panelWidth=Math.round((panelsWidth/panelCellsLength).toFixed(4));
    var panelWidth=Math.round(panelsWidth/panelCellsLength);
    Ispaces.logger.debug('panelWidth = '+panelWidth);

    var widthPercent;
    var cellFiles;

    panelCells.forEach(function(cellPanel){

      cellFiles=cellPanel.cellFiles
      ,tbody=cellPanel.tbody
      ,unorderedList=cellPanel.unorderedList
      //,widthPercent=cellPanel.widthPercent
      //,newWidth=Math.round(w*widthPercent)
      //,isTree=cellPanel.isTree
      ;

      //Common.unsetWidth(cellPanel);
      //cellPanelWidth=totalWidth/panelCellsLength;
      //Ispaces.logger.debug('cellPanelWidth = '+cellPanelWidth);
      //cellPanel.setWidthPixels(cellPanelWidth),cellPanel.setMaxWidth(cellPanelWidth);
      cellPanel.fixedWidth(panelWidth);
      //cellPanel.w=cellPanelWidth;
      //cellPanel.setBorder('red 1px solid');

      /* Calcualte and set the panel percentage width.
      widthPercent=(cellPanelWidth/totalWidth).toFixed(4); // toFixed(4) gives us better accuracy when adjust panel widths
      Ispaces.logger.debug('widthPercent = '+widthPercent);
      cellPanel.widthPercent=widthPercent;
      */

      if(cellFiles)cellFiles.fixedWidth(panelWidth);

      if(tbody){
        Ispaces.logger.debug('tbody.setWidthPixels('+panelWidth+')');
        tbody.setWidthPixels(panelWidth);
      }

      if(unorderedList){
        Ispaces.logger.debug('unorderedList.setWidthPixels('+panelWidth+')');
        unorderedList.setWidthPixels(panelWidth);
      }

    });

    _this.panelRow.addAfter(newPanel,cellPanel);
    _this.panelRow.addAfter(_this.createCenterGrabber(),cellPanel);

    _this.resetPositions(); // for dnd

    this.save();
  }

  /*
   * Create the JSON to be saved for each cellPanel.
   * E.g.
   *    [
   *      [1,'ispaces']
   *      ,[2,'c']
   *      ,[3,'dropbox']
   *    ]
   *
   * Todo: Make this native forEach() or collect().
   */
  ,save:function(){
    Ispaces.logger.debug(this.id+'.save()');

    //panelIndex
    //Ispaces.logger.warn(this.id+'.save(): panelIndex TBD');
    //return;

    //Ispaces.logger.debug('this.panelCells.length = '+this.panelCells.length);

    /*
    var i
    ,panelCells=this.panelCells
    ,panelCellsLength=this.panelCells.length
    ,a=[]
    ;

    for(i=0;i<panelCellsLength;i++){
      cellPanel=panelCells[i];
      //Ispaces.logger.debug('cellPanel.panelIndex = '+cellPanel.panelIndex);
      //a[i]=cellPanel.panelIndex;
      a[i]=[cellPanel.panelIndex,cellPanel.protocol];
    }
    */

    var rootArray=[];

    this.panelCells.forEach(function(cellPanel){

      //if(cellPanel.protocol){ // Do not save empty panels?
        //Ispaces.logger.debug('cellPanel.panelIndex = '+cellPanel.panelIndex); // No longer using panelIndex
        //rootArray.push([cellPanel.panelIndex,cellPanel.protocol]);
        //rootArray.push(cellPanel.protocol);
        rootArray.push({
          protocol:cellPanel.protocol
        });
      //} // Do not save empty panels?

    });

    var json=JSON.stringify(rootArray);
    Ispaces.logger.debug('json = '+json);

    /*
    var sb=new Ispaces.StringBuilder([
      "this.recreate("
      ,json
      ,Constants.Characters.RIGHTPAREN
    ]);
    //Ispaces.logger.debug('sb.asString() = '+sb.asString());
    Ispaces.spaces.getSpace().store.reset(this.id,sb.asString());
    */
    Ispaces.persistence.resetPersistable(
      this
      ,"recreate"
      ,json
    );
  }

  ,closePanel:function(cellPanel){
    Ispaces.logger.debug(this.id+'.closePanel(cellPanel:'+cellPanel+')');

    cellPanel=cellPanel||this.cellPanel; // just in case there is no panel passed in, like when closing a panel from a context menu.

    this.panelCells.remove(cellPanel); // remove the cellPanel from the array of panelCells

    //*
    if(this.panelCells.length==0){
      this.destroySave();
      return;
    }
    //*/

    // Grab the center grabber before removing the cellPanel from the DOM.
    var centerGrabber=cellPanel.previousSibling;
    if(!centerGrabber)centerGrabber=cellPanel.nextSibling;

    this.panelRow.removeNode(cellPanel); // remove the cellPanel from the DOM
    this.panelRow.removeNode(centerGrabber); // remove the centerGrabber from this.panelRow

    //var w=Common.getWidth(this.divMain);
    //var w=this.divMain.w=Common.getWidth(this.divMain);
    //this.divMain.w=Common.getWidth(this.divMain);
    var widthHeight=this.divApplication.widthHeight;
    if(!widthHeight)widthHeight=this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    //Ispaces.logger.debug('widthHeight = '+widthHeight);
    var w=widthHeight[0];

    this.adjustPanelWidthsPercent(w);
    this.adjustPanels(w);
    //this.adjustPanels(); // Adjust the cellPanel widths after removing it from the DOM.

    Common.asyncCall(_this,"save",1000); // Save the persisted state for recreation.
  }

  ,createListRoots:function(config){
    Ispaces.logger.debug(this.id+'.createListRoots('+config+')');
    //Ispaces.logger.alert(this.id+'.createListRoots('+config+')');

    var _this=this
    ,Create=_this.Create
    ,createListItem=Create.createListItem
    ,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n
    ;

    //var topbarCell=o.topbarCell;
    var topbarDiv=config.topbarDiv;
    var topbar=topbarDiv.topbar;
    var listItemSelected=config.listItemSelected; // When creating the root select, we pass in the previous selected root, so it can be reslected upon recreation.
    var firstTime=config.firstTime;
    //var panelIndex=config.panelIndex;
    var cellPanel=config.cellPanel;

    //Ispaces.logger.debug('topbarDiv = '+topbarDiv);
    //Ispaces.logger.debug('topbar = '+topbar);
    //Ispaces.logger.debug('listItemSelected = '+listItemSelected);
    //Ispaces.logger.debug('firstTime = '+firstTime);
    //Ispaces.logger.debug('panelIndex = '+panelIndex);
    Ispaces.logger.debug('cellPanel = '+cellPanel);

    //,z=roots.length
    var root
    ,rootId
    ,rootMap=Ispaces.Roots.rootMap
    ,protocol
    ,name
    ,displayName
    ,type
    ,isLocal
    ,totalUsage
    ,rootUnorderedList=Create.createElement(_this.Constants.UL)
    ,listItem
    ,listItems=[] // listItems = listitems @see mouseDownRoot() - this reference is used to show/hide the root items.

    // Constants
    ,Events=_this.Events
    ,MOUSEDOWN=Events.MOUSEDOWN
    ,CLICK=Events.CLICK
    //,TOUCHSTART=_this.Constants.TOUCHSTART
    ;

    /*
     * This adds the default initial "Select" drop-down menu item where the drop-down has not been clicked before.
     */
    //Ispaces.logger.debug('listItemSelected = '+listItemSelected);
    //Ispaces.logger.debug('firstTime = '+firstTime);

    if(firstTime){

      listItem=_this.createRootOption(
        _this.Create.createTextNodeI18n("Select")
        ,cellPanel
        //,panelIndex
      );

      listItem.protocol='select';
      listItem.name='select';
      listItem.topbarDiv=topbarDiv;
      listItem.setClass("selected");
      //listItem.rootUnorderedList=rootUnorderedList; // Set the UL elements as a property of the child LI element for easy access. @see mouseDownRoot()

      listItem.addListener(MOUSEDOWN,_this.mouseDownRoot.bind(_this,listItem));

      rootUnorderedList.add(listItem);

      rootUnorderedList.listItemSelected=listItem; // set a reference to the first li element. @see mouseDownRoot()
    }

    //Ispaces.logger.debug('roots.length = '+roots.length);

    //if(!listItemSelected){
    //  rootMap['select']={name:'Select',protocol:'select'};
    //}

    var localAdded=false;

    for(rootId in rootMap){

      root=rootMap[rootId]
      ,protocol=root.protocol
      ,name=root.name
      ,displayName=root.displayName||name
      ,type=root.type
      ,isLocal=root.isLocal
      ,totalUsage=root.totalUsage
      ;

      Ispaces.logger.debug('root = '+root);
      Ispaces.logger.debug('displayName = '+displayName);
      Ispaces.logger.debug('type = '+type);
      Ispaces.logger.debug('isLocal = '+isLocal);
      Ispaces.logger.debug('totalUsage = '+totalUsage);
      Ispaces.logger.debug('name = "'+name+'", type = "'+type+'", protocol = "'+protocol+'", isLocal = '+isLocal+'", totalUsage = '+totalUsage);

      if(!localAdded)if(isLocal)localAdded=true;

      /*
      var txt;
      if(isLocal){
        var sb=new Ispaces.StringBuilder();
        if(name==_this.FORWARDSLASH){ // Unix (/)
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
      var sb=new Ispaces.StringBuilder();
      if(isLocal){
        sb.append('Local Disk (').append(name).append(Constants.Characters.RIGHTPAREN);
      }else{
        sb.append('Cloud Files (').append(name).append(Constants.Characters.RIGHTPAREN);
      }
      name=sb.asString();
      */

      //*/

      //listItem=_this.createListItem(_this.Create.createTextNode(name));
      //listItem=_this.createListItem(_this.Create.createTextNode(txt));
      //listItem=_this.createRootOption(displayName,panelIndex);
      /*
      listItem=_this.createRootOption(
        displayName
        //,panelIndex
        //,cellPanel
      );
      */
      //listItem=Create.createListItem(Create.createTextNode(displayName));
      listItem=createListItem(createTextNodeI18n(displayName));

      //listItem.index=i;
      listItem.protocol=protocol;
      listItem.root=root;
      listItem.name=name;
      //listItem.topbarCell=topbarCell;
      listItem.topbarDiv=topbarDiv;
      listItem.isLocal=isLocal;
      //listItem.rootUnorderedList=rootUnorderedList; // Set a reference to the UL element.

      if(totalUsage){

        var size=Ispaces.StringFormat.bytesToSize(parseInt(totalUsage),1);
        Ispaces.logger.debug('size = '+size);

        Ispaces.logger.debug('listItem.add(createTextNode('+new Ispaces.StringBuilder([' (',size,')']).asString()+'))');
        listItem.add(createTextNode(new Ispaces.StringBuilder([' (',size,')']).asString()));
      }

      /*
      //listItem.ocButton(function(){_this.selectRoot(_this)});
      listItem.ocButton(function(e){
        Ispaces.logger.debug('listItem.ocButton('+e+')');
        _this.mouseDownRoot(_this);
        Common.stopEventPropagation(e); // Prevent the event from propogating as the DIV and event handler above this, as it opens the root select.
        Common.killEvent(e); // Prevent the event from propogating as the DIV and event handler above this, as it opens the root select.
        Common.preventDefaultEvent(e); // Prevent the event from propogating as the DIV and event handler above this, as it opens the root select.
        return false;
      });
      //*/
      //listItem.ocButton(_this.mouseDownRoot.bind(_this,protocol));
      //listItem.ocButton(_this.mouseDownRoot.bind(_this,listItem));

      /*
      if(Constants.isTouchDevice){
        //listItem.addListener('touchend',_this.mouseDownRoot.bind(_this,listItem),false); // touch
        listItem.addListener(
          'touchstart'
          ,_this.mouseDownRoot.bind(_this,listItem)
          ,false
        ); // touch
      }else{
        listItem.addListener(
          _this.Events.MOUSEDOWN
          ,_this.mouseDownRoot.bind(_this,listItem)
          ,false
        ); // click
      }
      */

      listItem.addListener(MOUSEDOWN,_this.mouseDownRoot.bind(_this,listItem));

      //listItem.mo(function(){_this.selectRoot(_this)});
      //if(i==0)listItem.setClass('selected'); // temporary
      /*
      if(i==0){
        listItem.setClass('selected'); // temporary
      }else{
        listItem.setClass('');
      }
      */

      if(listItemSelected){

        var selectedProtocol=listItemSelected.protocol;
        //Ispaces.logger.debug('protocol = '+protocol+', selectedProtocol = '+selectedProtocol);
        //Ispaces.logger.debug('selectedProtocol = '+selectedProtocol);
        if(selectedProtocol==protocol){
          //Ispaces.logger.debug(_this.id+'.createListRoots('+o+'): listItem.setClass(\'selected\')');
          listItem.setClass("selected");
          rootUnorderedList.listItem=listItem;
        }

      }else{

        //if(i==0){
        //if(i=='Select'){
        if(protocol=='select'){
          //Ispaces.logger.debug(_this.id+'.createListRoots('+o+'): listItem.setClass(\'selected\')');
          listItem.setClass("selected");
        }else{
          listItem.setClass('');
        }

      }

      rootUnorderedList.add(listItem);
      listItem.rootUnorderedList=rootUnorderedList; // Set the UL elements as a property of the child LI element for easy access.
      listItems.push(listItem); // Add the list item elements to the array of list items for quick access.

      /*
      if(
        !_this.localLi
        &&isLocal
        &&o.left
      ){
        _this.localLi=listItem;
        _this.localLi.setClass('selected');
      }else if(i==0)listItem.setClass('selected');
      */

      /*
      // Set the initial local root.
      if(o.left){
        //if(i==1){
        //  //listItem.setClass('selected');
        //  _this.clickListItem(listItem);
        //}else if(protocol.toLowerCase().startsWith('c')){
        //  //listItem.setClass('selected');
        //  _this.clickListItem(listItem);
        //}
        _this.rootLisLeft[protocol]=listItem;
      }else{
        if(i==0)listItem.setClass('selected');
        _this.rootLisRight[protocol]=listItem;
      }
      */


      /*
      var divIcon=Create.createDivCell();
      divIcon.setClass(type).setMinWidthHeight(16);
      divIcon.style.emptyCells='show';
      listItem.divIcon=divIcon;
      */

      /*
      //var divName=Create.createDiv(Create.createTextNode(name));
      var divName=Create.createElement(Constants.Tags.DIV).add(Create.createTextNode(name));
      divName.setClass('name');
      divName.setBorder(Constants.Borders.RED);
      divName.alignBottom();

      var divText=Create.createDivCell(divName);
      divText.setClass('text');
      divText.setBorder(Constants.Borders.ORANGE);

      //var divArrow=Create.createDivCell();
      var divArrow=Create.createDivCell(Create.createTextNode(Constants.Characters.NBSP));
      divArrow.setClass('arrow');
      divArrow.setBorder(Constants.Borders.ORANGE);

      //var divTable=Create.createDivTable(Create.createDivRow([divIcon,divText,divArrow]));
      var divTable=Create.createDivTable(Create.createDivRow([divText,divArrow]));
      divTable.setBorder(Constants.Borders.BLUE);
      */

    }

    /*
     * If the local roots have not been accessed, we provide a "Local Files" ption to load them.
     */
    //*
    //Ispaces.logger.debug(_this.id+'.createListRoots('+o+'): localAdded = '+localAdded);
    if(!localAdded){

      listItem=createListItem(createTextNodeI18n("Local Files"));
      //listItem=_this.createRootOption('Local Files');
      /*
      listItem=_this.createRootOption(
        'Local Files'
        //,panelIndex
        //,cellPanel
      );
      */

      listItem.addListener(CLICK,_this.addLocalRoots.bind(_this));

      listItem.rootUnorderedList=rootUnorderedList; // Set the UL elements as a property of the child LI element for easy access.
      //listItems.push(listItem); // Add the list item elements to the array of list items for quick access.
      rootUnorderedList.add(listItem);
    }
    //*/

    // Set the list items as a property of the UL element for quick access.
    rootUnorderedList.listItems=listItems;

    return rootUnorderedList;
  } // createListRoots()

  ,createRootOption:function(
    //txt // Changed to textNode so it can be internationalized.
    textNode
    ,cellPanel
    //,panelIndex
  ){
    Ispaces.logger.debug(this.id+'.createRootOption(textNode:'+textNode+', cellPanel:'+cellPanel+')');

    var _this=this
    ,Create=_this.Create
    ,createTextNode=Create.createTextNode
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivTable=Create.createDivTable
    ,Events=_this.Events
    ,CLICK=Events.CLICK
    ,MOUSEDOWN=Events.MOUSEDOWN
    ,MOUSEUP=Events.MOUSEUP
    ;

    //var listItem=Create.createListItem(Create.createTextNode(Ispaces.getString('Select')));
    //var textNode=Create.createTextNode(Ispaces.getString('Select'))
    //var divText=Create.createDiv(Create.createTextNode(Ispaces.getString(txt))).setClass("txt");

    var divText=createDiv(textNode).setClass("text")
    ,cellText=createDivCell(divText).setClass("cell-text")
    ;

    //if(panelIndex){ // if there is a panelIndex, add the refresh and close button.

    /*
     * Refresh button
     */
    //var divRefresh=Create.createDiv(Create.createTextNode(Common.unicode(84))).setClass('button') // 93, 84
    var divRefresh=createDiv(createTextNode('S')).setClass("button")
    ,cellRefresh=createDivCell(divRefresh).setClass("button-cell")
    ;

    /**
     * @click, @touchend
     */
    divRefresh.addListener(CLICK,this.refresh.bind(this,cellPanel));

    /**
     * Prevent the mouse down event from propagating to the divTable.
     * @click, @touchend
     */
    divRefresh.addListener(MOUSEDOWN,function(e){Common.stopEventPropagation(e)});

    /**
     * Prevent the mouse down event from propagating to the divTable.
     * @click, @touchend
     */
    divRefresh.addListener(MOUSEUP,function(e){Common.stopEventPropagation(e)});

    /*
     * Close button
     */
    //var divClose=Create.createDiv(Create.createTextNode(Common.unicode(73))).setClass('button')
    //var divClose=Create.createDiv(Create.createTextNode('H')).setClass('button')
    var divClose=createDiv(createTextNode('I')).setClass("button")
    ,cellClose=createDivCell(divClose).setClass("cell-button")
    ;

    /**
     * @click, @touchend
     */
    cellClose.addListener(CLICK,this.closePanel.bind(this,cellPanel));

    /**
     * Prevent the mouse down event from propagating to the divTable.
     * @click, @touchend
     */
    divClose.addListener(MOUSEDOWN,function(e){Common.stopEventPropagation(e)});

    /**
     * Prevent the mouse down event from propagating to the divTable.
     * @click, @touchend
     */
    divClose.addListener(MOUSEUP,function(e){Common.stopEventPropagation(e)});

    var rowButtons=Create.createDivRow([
      //cellRefresh
      cellClose
    ]);

    var tableButtons=createDivTable(rowButtons).setClass("table-root")
    ,cellButtons=createDivCell(tableButtons).setClass("cell-root")
    ;

    //var spacerCell=Create.createDivCell(Create.createTextNode(Constants.Characters.NBSP));

    var divRow=Create.createDivRow([
      cellText
      //,spacerCell
      ,cellButtons
    ]);

    var divTable=createDivTable(divRow);
    //var divTable=Create.createDivTable(divRow).setClass('topbar');
    divTable.setWidthPercent(100);
    //divTable.setBorder(Constants.Borders.ORANGE);

    //divTable.cellPanel=cellPanel;
    //divTable.div=panelDraggable;

    //return Create.createListItem(divTable);
    var listItem=Create.createListItem(divTable);

    listItem.divText=divText; // Set a reference to the text div so it can be updated. @see mouseDownRoot()

    return listItem;
  }

  ,recreateRootsAndSelectFirstLocal:function(){
    Ispaces.logger.debug(this.id+'.recreateRootsAndSelectFirstLocal()');
    //Ispaces.logger.alert(this.id+'.recreateRootsAndSelectFirstLocal()');

    this.cancel();
    this.recreateRoots();
    this.selectFirstLocal()
  }

  ,recreateRoots:function(){
    Ispaces.logger.debug(this.id+'.recreateRoots()');
    //Ispaces.logger.alert(this.id+'.recreateRoots()');

    Ispaces.logger.debug('this.panelCells = '+this.panelCells);
    //Ispaces.logger.alert('this.panelCells = '+this.panelCells);

    var _this=this
    ,Create=_this.Create
    ,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n
    ,createListItem=Create.createListItem
    ,createDivCell=Create.createDivCell
    ;

    var cellPanel
    ,cellRoots
    ,rootUnorderedList
    ,topbarDiv
    ,listItemSelected
    //,i
    //,panelCells=this.panelCells
    //,panelCellsLength=panelCells.length
    ;

    //Ispaces.logger.debug('panelCells.length = '+panelCells.length);

    //for(i=0;i<panelCellsLength;i++){

    this.panelCells.forEach(function(cellPanel){

      //cellPanel=panelCells[i]
      cellRoots=cellPanel.cellRoots
      ,rootUnorderedList=cellPanel.rootUnorderedList
      ,topbarDiv=cellPanel.topbarDiv
      ;

      Ispaces.logger.debug('cellPanel = '+cellPanel);
      Ispaces.logger.debug('cellRoots = '+cellRoots);
      Ispaces.logger.debug('rootUnorderedList = '+rootUnorderedList);
      Ispaces.logger.debug('topbarDiv = '+topbarDiv);
      //Ispaces.logger.debug('topbar = '+topbar);
      //Ispaces.logger.debug('listItemSelected = '+listItemSelected);
      //Ispaces.logger.debug('firstTime = '+firstTime);
      //Ispaces.logger.debug('panelIndex = '+panelIndex);

      var config={
        topbarDiv:topbarDiv
        ,firstTime:true
        //,firstTime:false
        //,panelIndex:panelIndex
        //,panelIndex:i
        ,cellPanel:cellPanel
      };

      Ispaces.logger.debug('rootUnorderedList.listItem = '+rootUnorderedList.listItem);
      listItemSelected=rootUnorderedList.listItem; // grab the selected list item, so we can reselect it after recreating the root select.
      Ispaces.logger.debug('listItemSelected = '+listItemSelected);
      if(listItemSelected)config.listItemSelected=listItemSelected;

      /*
      // The first time a root is created, it should show the "Select" option.
      // If there is no previously selected list item and this is not the active panel, then firstTime should be true.
      //if(!listItemSelected)config.firstTime=true; // The first time the root is created, it should default to 'Select'.
      //config.firstTime=false;
      if(
        !listItemSelected
        //&&panel!=this.panel
        &&cellPanel!=this.cellPanel
      ){
        config.firstTime=true; // The first time the root is created, it should default to 'Select'.
      }else{
        config.firstTime=false;
      }
      */

      /*
       * Create the new root UL.
       */
      //var rootUnorderedListNew=this.createListRoots(config);
      var rootUnorderedList=_this.createListRoots(config)
      //,cellRoots=createDivCell(rootUnorderedList).setClass("cell-roots")
      ;

      Ispaces.logger.debug('rootUnorderedList = '+rootUnorderedList);

      rootUnorderedList.cellRoots=cellRoots; // for root recreation
      cellPanel.rootUnorderedList=rootUnorderedList; // Set a reference to the rootUnorderedList on the cellPanel. @see divTable.ocButton().
      cellPanel.cellRoots=cellRoots; // for root recreation

      Ispaces.logger.debug('cellRoots.replaceFirst(rootUnorderedList:'+rootUnorderedList+')');
      cellRoots.replaceFirst(rootUnorderedList);

    });

  }

  /*
   * //@see Roots.getTotalUsage(protocol)
   * @see Roots.setLocalRoots(json,applicationId)
   */
  ,recreateRootsBak:function(){
    Ispaces.logger.debug(this.id+'.recreateRoots()');
    //Ispaces.logger.alert(this.id+'.recreateRoots()');

    Ispaces.logger.debug('this.panelCells = '+this.panelCells);
    //Ispaces.logger.alert('this.panelCells = '+this.panelCells);

    var cellPanel
    ,rootUnorderedList
    ,cellRoots
    ,topbarDiv
    ,listItemSelected
    ,panelCells=this.panelCells
    ,panelCellsLength=panelCells.length
    //,rootParent
    //,topbar
    //,selectedProtocol
    ,i
    ;

    //Ispaces.logger.debug('panelCells.length = '+panelCells.length);

    for(i=0;i<panelCellsLength;i++){

      cellPanel=panelCells[i]
      ,cellRoots=cellPanel.cellRoots
      ,rootUnorderedList=cellPanel.rootUnorderedList
      ,topbarDiv=cellPanel.topbarDiv
      ;

      //Ispaces.logger.debug('rootUnorderedList = '+rootUnorderedList);

      if(rootUnorderedList){

        //Ispaces.logger.debug('rootUnorderedList.listItem = '+rootUnorderedList.listItem);

        var config={
          topbarDiv:topbarDiv
          //,listItemSelecteds:listItemSelected
        };

        listItemSelected=rootUnorderedList.listItem; // grab the selected list item, so we can reselect it after recreating the root select.

        if(listItemSelected){

          //Ispaces.logger.debug('rootUnorderedList.listItem.protocol = '+rootUnorderedList.listItem.protocol);
          //Ispaces.logger.debug('listItemSelected = '+listItemSelected);
          //Ispaces.logger.debug('listItemSelected.protocol = '+listItemSelected.protocol);

          config.listItemSelected=listItemSelected;
        }

        /*
         * The first time a root is created, it should show the "Select" option.
         * If there is no previously selected list item and this is not the active panel, then firstTime should be true.
         */
        //if(!listItemSelected)config.firstTime=true; // The first time the root is created, it should default to 'Select'.
        //config.firstTime=false;
        if(
          !listItemSelected
          //&&panel!=this.panel
          &&cellPanel!=this.cellPanel
        ){
          config.firstTime=true; // The first time the root is created, it should default to 'Select'.
        }else{
          config.firstTime=false;
        }

        /*
         * Create the new root unordered list
         */
        var rootUnorderedListNew=this.createListRoots(config);


        /*
         * Add the new root listing to the parent, replacing the previous root lsiting.
         */
        //rootUnorderedList.parentNode.replace(rootUnorderedListNew,rootUnorderedList);
        /*
        rootParent=rootUnorderedList.parentNode;
        Ispaces.logger.debug('rootParent = '+rootParent);
        if(rootParent){
          rootParent.replace(rootUnorderedListNew,rootUnorderedList);
        }
        cellPanel.rootUnorderedList=rootUnorderedListNew;
        */
        //Ispaces.logger.debug('cellRoots:'+cellRoots+'.replaceFirst(rootUnorderedListNew:'+rootUnorderedListNew+')');
        cellRoots.replaceFirst(rootUnorderedListNew);
        cellPanel.rootUnorderedList=rootUnorderedListNew;
        cellPanel.cellRoots=cellRoots; // for root recreation
        rootUnorderedListNew.cellRoots=cellRoots; // for root recreation

        //rootUnorderedList.listItem=; // grab the selected list item, so we can reselect it after recreating the root select.
        //listItemSelected=listItemSelected

/*
      rootParent=rootUnorderedList.parentNode;
      topbar=topbarDiv.topbar;
      listItemSelected=rootUnorderedList.listItem; // grab the selected list item, so we can reselect it after recreating the root select.

      Ispaces.logger.debug('cellPanel.panelIndex = '+cellPanel.panelIndex);
      Ispaces.logger.debug('cellPanel.protocol = '+cellPanel.protocol);

      Ispaces.logger.debug('cellPanel = '+cellPanel);
      Ispaces.logger.debug('    rootUnorderedList = '+rootUnorderedList);
      Ispaces.logger.debug('    rootParent = '+rootParent);
      Ispaces.logger.debug('    topbarDiv = '+topbarDiv);
      Ispaces.logger.debug('    topbar = '+topbar);
      Ispaces.logger.debug('    listItemSelected = '+listItemSelected);

      var o={
        topbarDiv:topbarDiv
        ,listItemSelecteds:listItemSelected
      };

      var rootUnorderedListNew=this.createListRoots(config);
      cellPanel.rootUnorderedList=rootUnorderedListNew; // Set a reference to the rootUnorderedList on the cellPanel. @see divTable.ocButton().
      rootUnorderedListNew.mdmu(function(e){Common.stopEventPropagation(e)}); // prevent the mouse down/mouse up event from propagating to the divTable and creating a drag handler
      cellPanel.rootUnorderedList=rootUnorderedListNew; // Set a reference to the rootUnorderedList on the cellPanel. @see divTable.ocButton().

      Ispaces.logger.debug('rootUnorderedListNew.gCN() = '+rootUnorderedListNew.gCN());

      rootParent.replace(rootUnorderedListNew,rootUnorderedList);
      //rootParent.replaceFirst(rootUnorderedListNew,rootUnorderedList);
*/

      } // if(rootUnorderedList)
    }

  }

  ,selectFirstLocal:function(){
    Ispaces.logger.debug(this.id+'.selectFirstLocal()');
    //Ispaces.logger.alert(this.id+'.selectFirstLocal()');

    var cellPanel=this.cellPanel
    ,rootUnorderedList=cellPanel.rootUnorderedList
    ;

    //Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('rootUnorderedList = '+rootUnorderedList);

    var firstLocalListItem=this.getFirstLocalListItem(rootUnorderedList);
    Ispaces.logger.debug('firstLocalListItem = '+firstLocalListItem);

    rootUnorderedList.isOpen=true;
    firstLocalListItem.isOpen=true; // Set the isOpen flag on the listItem so that the dropdown is closed.

    this.mouseDownRoot(firstLocalListItem);
  }

  ,getFirstLocalListItem:function(rootUnorderedList){
    Ispaces.logger.debug(this.id+'.getFirstLocalListItem(rootUnorderedList:'+rootUnorderedList+')');

    var listItem
    ,listItems=rootUnorderedList.listItems
    ,listItemsLength=listItems.length
    ;

    //Ispaces.logger.debug('listItems.length = '+listItems.length);

    for(var i=0;i<listItemsLength;i++){
      listItem=listItems[i];
      //Ispaces.logger.debug('listItem.protocol = '+listItem.protocol+', listItem.isLocal = '+listItem.isLocal);
      if(listItem.isLocal)return listItem;
    }

    //var listItem=listItems.some(function(listItem){if(listItem.isLocal)return listItem});
    //return listItem;
    //return listItems.some(function(listItem){if(listItem.isLocal)return listItem}); // Experimenting with Array.some()
  }

  ,selectFirstLocalListItem:function(rootUnorderedList){
    Ispaces.logger.debug(this.id+'.getFirstLocalListItem('+rootUnorderedList+')');

    var childNodes=rootUnorderedList.childNodes;
    //Ispaces.logger.debug('childNodes = '+childNodes);
    //Ispaces.logger.debug('childNodes.length = '+childNodes.length);

    var listItem
    ,listItems=rootUnorderedList.listItems
    ,listItemsLength=listItems.length
    ,i
    ;

    //Ispaces.logger.debug('listItems.length = '+listItems.length);

    var cellPanel=this.cellPanel;

    for(i=0;i<listItemsLength;i++){
      listItem=listItems[i];
      //Ispaces.logger.debug('listItem.protocol = '+listItem.protocol+', listItem.isLocal = '+listItem.isLocal);

      if(listItem.isLocal){

        //Ispaces.logger.debug('listItem.setClass(\'selected\')');
        listItem.setClass("selected");

        this.tree({
          cellPanel:cellPanel
          //,divFiles:cellPanel.divFiles
          ,cellFiles:cellPanel.cellFiles
          ,protocol:listItem.protocol
          ,isLocal:true
          //,refresh:true
        });

      }else{

        //Ispaces.logger.debug('listItem.setClass('+this.Constants.EMPTY+')');
        listItem.setClass(this.Constants.EMPTY);

      }
    }
  }

  ,mouseUpLeftGrabber:function(
    grabber
    ,e
  ){
    Ispaces.logger.debug(this.id+'.mouseUpLeftGrabber(grabber:'+grabber+', e:'+e+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    Common.killEvent(e);  // Prevent any default browser behaviour like text selection ??

    //Ispaces.logger.debug('grabber.tableHeader = '+grabber.tableHeader);
    var tableHeader=grabber.tableHeader;

    //Ispaces.logger.debug('typeof tableHeader.resizeColumnFunction = '+typeof tableHeader.resizeColumnFunction);

    if(tableHeader.resizeColumnFunction){

      //Ispaces.logger.debug(this.id+'.mouseUpLeftGrabber(grabber:'+grabber+', e:'+e+'): tableHeader.resizeColumnFunction = '+tableHeader.resizeColumnFunction);

      Common.removeListener(
        document
        ,Constants.Events.MOUSEMOVE
        ,tableHeader.resizeColumnFunction
      );

      tableHeader.resizeColumnFunction=null;

      //var tableHeaderPrevious=tableHeader.previousSibling;
      //var w=Common.getWidth(tableHeaderPrevious);
      //this.resetColumnWidth(tableHeaderPrevious.index,w);
      this.resetColumnWidth(tableHeader.previousSibling);
    }

    return false;  // Prevent any default browser behaviour like text selection ??
  }

  /*
  ,resetColumnWidth:function(col,w){
    Ispaces.logger.debug(this.id+'.resetColumnWidth('+col+', '+w+')');

    //this.leftDivFiles.table;
    //this.leftDivFiles.table.tbody;
    //this.leftDivFiles.table.tbody.firstChild // TR
    //this.leftDivFiles.table.tbody.firstChild.firstChild // TD0

    //Ispaces.logger.debug(this.classId+'.resetColumnWidth('+col+', '+w+'): this.leftDivFiles.table.tbody = '+this.leftDivFiles.table.tbody);
    //Ispaces.logger.debug(this.classId+'.resetColumnWidth('+col+', '+w+'): this.leftDivFiles.table.tbody.firstChild = '+this.leftDivFiles.table.tbody.firstChild);
    //Ispaces.logger.debug(this.classId+'.resetColumnWidth('+col+', '+w+'): this.leftDivFiles.table.tbody.firstChild.childNodes.length = '+this.leftDivFiles.table.tbody.firstChild.childNodes.length);
    //Ispaces.logger.debug(this.classId+'.resetColumnWidth('+col+', '+w+'): this.leftDivFiles.table.tbody.firstChild.childNodes[col] = '+this.leftDivFiles.table.tbody.firstChild.childNodes[col]);

    ////this.leftDivFiles.table.tbody.firstChild.firstChild.setWidthPixels(w);
    //this.leftDivFiles.table.tbody.firstChild.childNodes[col].setWidthPixels(w);
    //this.leftDivFiles.table.tbody.firstChild.childNodes[col].setMinWidth(w);
    //this.leftDivFiles.table.tbody.firstChild.childNodes[col].setMaxWidth(w);

    var childNodes=this.leftDivFiles.table.tbody.childNodes;
    Ispaces.logger.debug(this.id+'.resetColumnWidth('+col+', '+w+'): childNodes.length = '+childNodes.length);
    for(var i=0;i<childNodes.length;i++){
      var tableRow=childNodes[i];
      var tableCell=tableRow.childNodes[col];
      tableCell.setWidthPixels(w);
      tableCell.setMinWidth(w);
      tableCell.setMaxWidth(w);
    }
  }
  */
  ,resetColumnWidth:function(tableHeader){
    Ispaces.logger.debug(this.id+'.resetColumnWidth(tableHeader:'+tableHeader+')');

    var tableHeaderWidth=Common.getWidth(tableHeader);
    var columnIndex=tableHeader.index;

    Ispaces.logger.debug('tableHeaderWidth = '+tableHeaderWidth);
    Ispaces.logger.debug('columnIndex = '+columnIndex);

    //this.columnWidths[columnIndex]=tableHeaderWidth;
    this.headers[columnIndex]._width=tableHeaderWidth;

    this.resetColumnWidths(tableHeader);
  }

  ,resetColumnWidths:function(tableHeader){
    Ispaces.logger.debug(this.id+'.resetColumnWidths(tableHeader:'+tableHeader+')');

    //var tbody=this.tbody
    var tableRow=tableHeader.parentNode;
    var thead=tableRow.parentNode;
    var tbody=thead.nextSibling;

    Ispaces.logger.debug(this.id+'.resetColumnWidths(tableHeader:'+tableHeader+'): thead = '+thead);
    Ispaces.logger.debug(this.id+'.resetColumnWidths(tableHeader:'+tableHeader+'): tbody = '+tbody);

    var childNodes=tbody.childNodes
    //,columnWidths=this.columnWidths
    ,headers=this.headers
    ,columnWidth
    ,col
    ,tableRow
    ,i=0
    //,z=childNodes.length
    ,z=headers.length
    ;

    Ispaces.logger.debug('tbody = '+tbody);
    Ispaces.logger.debug('childNodes = '+childNodes);
    Ispaces.logger.debug('childNodes.length = '+childNodes.length);

    for(i;i<z;i++){

      tableRow=childNodes[i];

      //for(var j=0;j<tableRow.childNodes.length;j++){
      //for(var j=0;j<columnWidths.length;j++){
      for(var j=0;j<headers.length;j++){

        //tableCell=tableRow.childNodes[j];
        //columnWidth=columnWidths[j];
        columnWidth=headers[j]._width;

        //tableCell.setWidthPixels(w);
        //tableCell.setMinWidth(w);
        //tableCell.setMaxWidth(w);
        //tableRow.childNodes[j].fixedWidth(columnWidths[i])
        tableRow.childNodes[j].fixedWidth(columnWidth)

      }
    }
  }


  /*
   * Sorting by clicking the table header.
   */
  ,clickTableHeader:function(
    tableHeader // the table header element
  ){
    Ispaces.logger.debug(this.id+'.clickTableHeader(tableHeader:'+tableHeader+')');

    //var sorted=this.sortTable.bind(this,tableHeader.name);
    var arrowChar=this.sortTable(tableHeader.name); // If there is a sort performed, the arrow character is returned.

    //if(sorted){
    if(arrowChar){

      Ispaces.logger.debug('arrowChar = '+arrowChar);

      var tbody=this.createTbody(this.contacts);//.setClass("tbody");

      //this.table.replace(tbody,this.tbody);
      //this.tbody=tbody;
      this.replaceTbody(tbody);

      var downCell=tableHeader.downCell;
      //downCell.childNodes[0]['nodeValue']=''+arrowChar; // Change the down/up arrow.
      downCell.childNodes[0].nodeValue=''+arrowChar; // Change the down/up arrow.
    }

    /*
     * Deselect the previous active th, and select this tableHeader by setting its className to 'selected'.
     */
    /* Replaced with forEach() below.
    var tableHeaders=this.tableHeaders
    ,i=0
    ,z=tableHeaders.length
    ;
    for(i;i<z;i++){tableHeaders[i].setClass('')}
    */
    var EMPTY=Constants.Characters.EMPTY;
    this.tableHeaders.forEach(function(tableHeader){tableHeader.setClass(EMPTY)});

    tableHeader.setClass("selected");
  }

  /*
   * Sorting
   * @param fieldName the field name to sort by
   */
  ,sortTable:function(fieldName){
    Ispaces.logger.debug(this.id+'.sortTable("'+fieldName+'")');
    Ispaces.logger.alert(this.id+'.sortTable("'+fieldName+'")');

    return; // File sorting to be fixed.

    var sorted=false;
    var arrowChar=6;
    var contacts=this.contacts;
    var arrowCharUp=6;
    var arrowCharDown=7;

    switch(fieldName){

      case "isChecked":

        if(this.sortedByCheckedAsc){
          //contacts.sort(Ispaces.FileSorter.sortByCheckedDesc.bind(this));
          contacts.sort(Ispaces.FileSorter.sortByCheckedDesc);
          this.sortedByCheckedAsc=false;
          arrowChar=arrowCharUp;
        }else{
          //this.contacts.sort(Ispaces.Sorter.sortByCheckedAsc);
          //contacts.sort(Ispaces.Sorter.sortByCheckedAsc.bind(this));
          contacts.sort(Ispaces.FileSorter.sortByCheckedAsc);
          this.sortedByCheckedAsc=true;
          arrowChar=arrowCharDown;
        }

        sorted=true;
        break;

      case "name":

        if(this.sortedByNameAsc){
          contacts.sort(Ispaces.Sorter.sortByNameDesc.bind(this));
          this.sortedByNameAsc=false;
          arrowChar=arrowCharUp;
        }else{
          contacts.sort(Ispaces.Sorter.sortByNameAsc.bind(this));
          this.sortedByNameAsc=true;
          arrowChar=arrowCharDown;
        }

        sorted=true;
        break;

      case "size":

        if(this.sortedBySizeAsc){
          contacts.sort(Ispaces.Sorter.sortBySizeDesc.bind(this));
          this.sortedBySizeAsc=false;
          arrowChar=arrowCharUp;
        }else{
          contacts.sort(Ispaces.Sorter.sortBySizeAsc.bind(this));
          this.sortedBySizeAsc=true;
          arrowChar=arrowCharDown;
        }

        sorted=true;
        break;

      case "timeCreated":

        if(this.sortedByTimeCreatedAsc){
          contacts.sort(Ispaces.Sorter.sortByTimeCreatedDesc.bind(this));
          this.sortedByTimeCreatedAsc=false;
          arrowChar=7;
        }else{
          contacts.sort(Ispaces.Sorter.sortByTimeCreatedAsc.bind(this));
          this.sortedByTimeCreatedAsc=true;
          arrowChar=arrowCharDown;
        }

        sorted=true;
        break;
    }

    if(sorted){ // If there was a sort performed, replace the tbody.

      /*
      var tbody=this.createTbody(contacts);
      this.table.replace(tbody,this.tbody);
      this.tbody=tbody;

      var downCell=th.downCell;
      //downCell['nodeValue']='7';
      //downCell['nodeValue']=''+arrowChar;
      downCell.childNodes[0]['nodeValue']=''+arrowChar; // Change the down/up arrow.
      */
      return arrowChar;
    }

    return false;
  }


  ,columnMouseUp:function(e){
    Ispaces.logger.debug(this.id+'.columnMouseUp('+e+')');

    var w=getWidth(resizeColumn);
    Ispaces.logger.debug(this.id+'.columnMouseUp('+e+'): w = '+w+', resizeColumn.index = '+resizeColumn.index);
    this.resetColumnWidth(resizeColumn.index,w);

    resizing=false;
    resizeColumn=null;
    resizeColumnObject=null;
  }

  /*
   * Make this function more dynamic by passing in the divFiles to be refreshed?
   */
  ,tree:function(config){
    Ispaces.logger.debug(this.id+'.tree('+config+')');

    var cellPanel=config.cellPanel
    ,protocol=config.protocol
    //,divFiles=cellPanel.divFiles
    ,cellFiles=cellPanel.cellFiles
    ,refresh=config.refresh
    ,isLocal=cellPanel.isLocal
    ,filePath=config.filePath
    ;

    //Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('protocol = '+protocol);
    //Ispaces.logger.debug('divFiles = '+divFiles);
    //Ispaces.logger.debug('cellFiles = '+cellFiles);
    //Ispaces.logger.debug('refresh = '+refresh);
    //Ispaces.logger.debug('isLocal = '+isLocal);
    //Ispaces.logger.debug('filePath = '+filePath);

    // Clear the dropFolders
    //cellPanel.dropFolders.clear();
    cellPanel.dropFolders=[];

    /*
     * Asyncronously get the file listing using a callback.
     */
    var _this=this
    ,Constants=_this.Constants
    ,path=Constants.FORWARDSLASH
    ,fileName=Constants.EMPTY
    ;

    Ispaces.Files.getAsync(
      isLocal
      ,protocol
      ,path
      ,fileName
      ,_this.createTree.bind(_this,cellPanel)
      //,_this.createTree.bind(_this,cellPanel,isLocal,protocol,path)
      ,refresh
    );

  }

  ,createTree:function(
    cellPanel
    ,isLocal
    ,protocol
    ,path
    ,fileMap
  ){
    Ispaces.logger.debug(this.id+'.createTree(cellPanel:'+cellPanel+', isLocal:'+isLocal+', protocol:'+protocol+', path:'+path+', fileMap:'+fileMap+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    /*
     * If the fileMap being returned is a string, it is the authentication URL.
     */
    //Ispaces.logger.debug('Common.isString(fileMap) = '+Common.isString(fileMap));
    if(Common.isString(fileMap)){

      this.authenticate(protocol,fileMap);
      return;
    }

    var unorderedList=this.createTreeUnorderedList(
      isLocal
      ,protocol
      ,path
      ,fileMap
      ,cellPanel  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
    );

    var divFiles=cellPanel.divFiles;
    var cellFiles=cellPanel.cellFiles;

    Ispaces.logger.debug('divFiles = '+divFiles);
    Ispaces.logger.debug('cellFiles = '+cellFiles);

    cellPanel.unorderedList=unorderedList; // Set a reference to the unorderedList. @see setFileCellsHeights()
    //divFiles.setOverflowY(Constants.Properties.SCROLL);
    //cellFiles.setOverflowY(Constants.Properties.SCROLL);

    /*
    unorderedList.setBorder(Constants.Borders.GREEN);
    divFiles.setBorder(Constants.Borders.RED);
    cellFiles.setBorder(Constants.Borders.BLUE);
    //*/

    //Ispaces.logger.debug('divFiles = '+divFiles);
    //Ispaces.logger.debug('cellFiles = '+cellFiles);

    //var applicationWidthHeight=this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    //Ispaces.logger.debug('applicationWidthHeight = '+applicationWidthHeight);
    //Ispaces.logger.alert('applicationWidthHeight = '+applicationWidthHeight);
    //this.setFileCellsHeights(applicationWidthHeight[1]);
    //this.setHeightPixels(applicationWidthHeight[1]);


    //if(!divFiles){
    if(!cellFiles){

      //divFiles=cellPanel.divFiles=this.Create.createDiv(unorderedList).setClass("files"); // double set - divFiles & cellPanel.divFiles
      cellFiles=cellPanel.cellFiles=this.Create.createDiv(unorderedList).setClass("cell-files"); // double set - divFiles & cellPanel.divFiles
      //divFiles.setWidthPixels(widthHeight[0]);

      /*
      //divFiles.setHeightPixels(widthHeight[1]);
      divFiles.fixedHeight(widthHeight[1]);
      //divFiles.setOverflowX(Constants.Properties.HIDDEN);
      //divFiles.setOverflowY(Constants.Properties.AUTO);
      divFiles.setOverflowX(Constants.Properties.HIDDEN);
      divFiles.setOverflowY(Constants.Properties.AUTO);
      divFiles.style['overflow-x']='scroll';
      divFiles.style['overflow-y']='scroll';
      cellFiles.style['overflow-x']='scroll';
      cellFiles.style['overflow-y']='scroll';
      */

      //cellFiles.replaceFirst(unorderedList); // Replace the old file table with the new one.
      //cellFiles.add(divFiles); // Replace the old file table with the new one.
      cellFiles.replaceFirst(divFiles); // Replace the old file table with the new one.

    }else{

      //divFiles.replaceFirst(unorderedList); // Replace the old file table with the new one.

      /*
      //divFiles.fixedHeight(widthHeight[1]);
      //divFiles.setOverflowX(Constants.Properties.HIDDEN);
      //divFiles.setOverflowY(Constants.Properties.AUTO);
      //divFiles.setOverflowY(Constants.Properties.SCROLL);
      cellPanel.fixedHeight(widthHeight[1]);
      //cellPanel.setOverflowY(Constants.Properties.SCROLL);
      divFiles.style['overflow-x']='scroll';
      divFiles.style.overflowX='scroll';
      divFiles.style['overflow-y']='scroll';
      cellFiles.style['overflow-x']='scroll';
      cellFiles.style['overflow-y']='scroll';
      cellFiles.style.overflowY='scroll';
      */

      //divFiles.removeAll();
      cellFiles.removeAll();

      //divFiles.add(unorderedList);
      Ispaces.logger.debug('cellFiles.add('+unorderedList+')');
      Ispaces.logger.debug(cellFiles+'.add('+unorderedList+')');
      cellFiles.add(unorderedList);

      //divFiles.replaceFirst(unorderedList); // Replace the previous listing with the new one.
      cellPanel.viewTable.show(); // The view selector is initially hidden and gets shown when a root is selected.
    }

    //var widthHeight=Common.getWidthHeight(cellFiles);
    //Ispaces.logger.debug('widthHeight = '+widthHeight);
    var widthHeight=Common.getWidthHeight(cellPanel);
    Ispaces.logger.debug('widthHeight = '+widthHeight);

    //unorderedList.setOverflowX(Constants.Properties.HIDDEN);
    //unorderedList.setOverflowY(Constants.Properties.AUTO);
    //divFiles.setOverflowX(Constants.Properties.HIDDEN);
    //divFiles.setOverflowY(Constants.Properties.AUTO);
    cellFiles.setOverflowX(Constants.Properties.HIDDEN);
    cellFiles.setOverflowY(Constants.Properties.AUTO);

    //var applicationWidthHeight=this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    var applicationWidthHeight=this.resetDimensions();
    //Ispaces.logger.debug('applicationWidthHeight = '+applicationWidthHeight);
    //this.resetDimensions();
    //this.setFileCellsHeights(applicationWidthHeight[1]);
    this.setHeightPixels(applicationWidthHeight[1]);

    /*
    divFiles.style['overflow-x']='scroll';
    divFiles.style['overflow-y']='scroll';
    cellFiles.style['overflow-x']='scroll';
    cellFiles.style['overflow-y']='scroll';
    //*/

    //*
    //divFiles.setHeightPixels(widthHeight[1]);
    //divFiles.fixedHeight(widthHeight[1]);
    //divFiles.setOverflowX(Constants.Properties.HIDDEN);
    //divFiles.setOverflowX(Constants.Properties.AUTO);
    //divFiles.setOverflowY(Constants.Properties.AUTO);
    //divFiles.setOverflowY(Constants.Properties.SCROLL);
    //divFiles.setOverflowY(Constants.Properties.HIDDEN);
    //divFiles.setOverflowY('auto');
    //divFiles.style.overflowX='hidden';
    //divFiles.style.overflowY='auto';
    //*/

    //*
    cellPanel.fixedHeight(widthHeight[1]);
    //cellPanel.setOverflowY(Constants.Properties.AUTO);
    //cellPanel.setOverflowY(Constants.Properties.HIDDEN);
    //cellPanel.setOverflowX(Constants.Properties.HIDDEN);
    //cellPanel.setOverflowX(Constants.Properties.AUTO);
    //cellPanel.setOverflowY('auto');
    //cellPanel.style.overflowX='hidden';
    //cellPanel.style.overflowY='auto';
    //*/

    //var applicationWidthHeight=this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    //Ispaces.logger.debug('applicationWidthHeight = '+applicationWidthHeight);
    //Ispaces.logger.alert('applicationWidthHeight = '+applicationWidthHeight);
    //this.setFileCellsHeights(applicationWidthHeight[1]);
    //this.setHeightPixels(applicationWidthHeight[1]);

    cellPanel.unorderedList=unorderedList; // Set a reference to the tree on the cellPanel. @see refreshPath()
    //cellPanel.isLocal=isLocal; // @see okCopy()

    //unorderedList.cellPanel=cellPanel;
    //listItem.unorderedList.show();
    //unorderedList.show();
    //this.openListItem(listItem);

    //if(!isLocal)new Ispaces.AsyncApply(_this,"treeLoaded",[protocol],1);
  }

  /*
   * This creates a UL element containing the listing for the specified path.
   */
  ,createTreeUnorderedList:function(
    isLocal
    ,protocol
    ,path
    ,fileMap
    ,cellPanel  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
  ){
    Ispaces.logger.debug(this.id+'.createTreeUnorderedList(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileMap:'+Common.getSize(fileMap)+')');

    // Create the unordered list.
    //var unorderedList=this.Create.createElement(Constants.Tags.UL);
    var unorderedList=this.Create.createElement(this.Constants.UL);
    //var unorderedList=this.createUnorderedList().addAll(folders).addAll(files);
    //var unorderedList=this.Create.createDiv();

    var listItem
    ,fileName
    ,folders=[]  // Split the file listing into folders and files.
    ,folderDivs=[]  // Split the file listing into folders and files.
    ,files=[]
    ;

    for(fileName in fileMap){
      //Ispaces.logger.debug('fileName = '+fileName);

      listItem=this.createTreeItem(
        isLocal
        ,protocol
        ,path
        ,fileName
        ,fileMap[fileName]
      );

      //listItem.setBorder(Constants.Borders.BLUE);
      //unorderedList.listItem=listItem; // @see
      //listItem.unorderedList=unorderedList; // set a reference to the UL on the LI @see
      listItem.parentUnorderedList=unorderedList; // set a reference to the parent UL on the LI @see drop() & mouseUp() & copied()
      // May be able to use parentNode instead

      if(listItem.isDir){
        folders.push(listItem);
        folderDivs.push(listItem.div);
      }else{
        files.push(listItem);
      }

    }

    unorderedList.addAll(folders).addAll(files); // Add the folders first, then the files.

    unorderedList.setAttribute('name','file-ul');
    unorderedList.setClass("file-ul");
    //unorderedList.setBorder(Constants.Borders.RED);

    //this.addDropTargets(folders); // Add drop targets on the folders.
    //this.addDropFolders(folders); // Add drop targets on the folders.
    //this.addDropFolders(folderDivs); // Add drop targets on the folders.
    //cellPanel.dropFolders=folders; // Add drop targets on the folders.  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
    //cellPanel.dropFolders=folderDivs; // Add drop targets on the folders.  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
    var dropFolders=cellPanel.dropFolders;
    if(!dropFolders)dropFolders=cellPanel.dropFolders=[];
    dropFolders.addAll(folderDivs); // Add drop targets on the folders.  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
    Ispaces.logger.debug('dropFolders.length = '+dropFolders.length);

    return unorderedList;
  }

  ,flat:function(o){
    Ispaces.logger.debug(this.id+'.flat('+o+')');

    var cellPanel=o.cellPanel
    ,protocol=o.protocol
    //,divFiles=cellPanel.divFiles
    ,cellFiles=cellPanel.cellFiles
    ,refresh=o.refresh
    ,isLocal=cellPanel.isLocal
    ,filePath=o.filePath
    ;

    Ispaces.logger.debug('cellPanel = '+cellPanel);
    Ispaces.logger.debug('protocol = '+protocol);
    //Ispaces.logger.debug('divFiles = '+divFiles);
    Ispaces.logger.debug('cellFiles = '+cellFiles);
    Ispaces.logger.debug('refresh = '+refresh);
    Ispaces.logger.debug('isLocal = '+isLocal);
    Ispaces.logger.debug('filePath = '+filePath);

    // Clear the dropFolders
    //cellPanel.dropFolders.clear();
    cellPanel.dropFolders=[];

    /*
     * Asyncronously get the file listing using a callback.
     */
    var _this=this
    ,Constants=_this.Constants
    ,FORWARDSLASH=Constants.FORWARDSLASH
    ,EMPTY=Constants.EMPTY
    ;

    Ispaces.Files.getAsync(
      isLocal
      ,protocol
      ,FORWARDSLASH // path
      ,EMPTY // fileName
      ,_this.createFlat.bind(_this,cellPanel)
      //,this.createTree.bind(this,cellPanel,isLocal,protocol,path)
      ,refresh
    );

  }

  ,createFlat:function(
    cellPanel
    ,isLocal
    ,protocol
    ,path
    ,fileMap
  ){
    Ispaces.logger.debug(this.id+'.createFlat(cellPanel:'+cellPanel+', isLocal:'+isLocal+', protocol:'+protocol+', path:'+path+', fileMap:'+fileMap+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    /*
     * If the fileMap being returned is a string, it is the authentication URL.
     */
    Ispaces.logger.debug('typeof fileMap = '+typeof fileMap);
    Ispaces.logger.debug('Common.isString(fileMap) = '+Common.isString(fileMap));

    if(Common.isString(fileMap)){
      this.authenticate(protocol,fileMap);
      //this.authenticate(protocol,'http://www.irishdictionary.ie');
      return;
    }

    /*
    var fileTable=this.createTableFiles(root,path,fileMap,cell.divFiles); // Create the new file table.
    cell.divFiles.replaceFirst(fileTable); // Replace the old file table with the new one.
    this.mouseDownTableRow(null,fileTable.tbody.firstChild,cell.divFiles); // Simulate the mouse down on the first row, to select it.
    */

    var tableFiles=this.createTableFiles(
      isLocal
      ,protocol
      ,path
      ,fileMap
      ,cellPanel  // Also pass in the cellPanel so the dropFolders can be set as  aproperty of it.
    );

    //tableFiles.positionAbsolute(); // No longer using this as the tbody now gets resized and produces a scrollbar when necessary.

    var tbody=tableFiles.tbody;
    cellPanel.tbody=tbody;

    var divFiles=cellPanel.divFiles;
    var cellFiles=cellPanel.cellFiles;

    //Ispaces.logger.debug('divFiles = '+divFiles);
    //Ispaces.logger.debug('cellFiles = '+cellFiles);

    // Set the width/height of the tbody so it gets its scrollbars when necessary.
    //var widthHeight=Common.getWidthHeight(cellFiles);
    var widthHeight=Common.getWidthHeight(cellPanel);
    Ispaces.logger.debug('widthHeight = '+widthHeight);
    //cellPanel.fixedWidth(widthHeight[0]);
    //cellPanel.fixedHeight(widthHeight[1]);
    tbody.setWidthPixels(widthHeight[0]);
    //tbody.setHeightPixels(widthHeight[1]);

    var applicationWidthHeight=this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    Ispaces.logger.debug('applicationWidthHeight = '+applicationWidthHeight);
    //this.setFileCellsHeights(applicationWidthHeight[1]);
    this.setHeightPixels(applicationWidthHeight[1]);

    //if(!divFiles){
    if(!cellFiles){

      //divFiles=this.Create.createDiv(tableFiles).setClass("files");
      cellFiles=this.Create.createDiv(tableFiles).setClass("cell-files");

      //divFiles.setWidthPixels(widthHeight[0]);
      //divFiles.setOverflowX(Constants.Properties.HIDDEN); // Now in CSS
      //divFiles.setOverflowY(Constants.Properties.AUTO);

      //cellPanel.divFiles=divFiles;  // Set a reference to divFiles on cellPanel.
      cellPanel.cellFiles=cellFiles;  // Set a reference to cellFiles on cellPanel.

      //cellFiles.add(divFiles); // Replace the old file table with the new one.
      //cellFiles.replaceFirst(divFiles); // Replace the old file table with the new one.

    }else{

      //divFiles.replaceFirst(tableFiles); // Replace the old file table with the new one.

      //divFiles.removeAll();
      cellFiles.removeAll();

      //var colDiv=this.createColumnHeaders();
      //cellPanel.colDiv=colDiv;
      //divFiles.addAll([
      //  colDiv
      //  ,tableFiles
      //]);
      //divFiles.add(tableFiles);
      cellFiles.add(tableFiles);

      cellPanel.viewTable.show(); // The view selector is initially hidden and gets shown when a root is selected.
    }

    this.resetPositions(); // for dnd

    /*
    // Set the width/height of the tbody so it gets its scrollbars when necessary.
    var widthHeight=Common.getWidthHeight(cellFiles);
    Ispaces.logger.debug('widthHeight = '+widthHeight);
    cellPanel.fixedWidth(widthHeight);
    tbody.setWidthPixels(widthHeight);
    //*/

    cellPanel.tableFiles=tableFiles; // Set a reference to the tree on the cellPanel. @see refreshPath()
    //cellPanel.isLocal=isLocal; // @see okCopy()

    //rootUnorderedList.cellPanel=cellPanel;
    //listItem.rootUnorderedList.show();
    //rootUnorderedList.show();
    //this.openListItem(listItem);

    //if(!isLocal)new Ispaces.AsyncApply(_this,"treeLoaded",[protocol],1);
  }

  //,setTbodyDimensions:function(w,h){
  //  Ispaces.logger.debug(this.id+'.setTbodyDimensions('+w+', '+h+')');
  //}

  //,createTableFiles:function(root,path,fileMap,div){
  //  Ispaces.logger.debug(this.id+'.createTableFiles("'+root+'", "'+path+'", '+fileMap+')');
  ,createTableFiles:function(
    isLocal
    ,protocol
    ,path
    ,fileMap
    ,cellPanel  // Also pass in the cellPanel so the dropFolders can be set as  aproperty of it.
  ){
    Ispaces.logger.debug(this.id+'.createTableFiles(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileMap:'+Common.getSize(fileMap)+', cellPanel:'+cellPanel+')');

    var thead=this.createThead();

    var tbody=this.createTbody(
      isLocal
      ,protocol
      ,path
      ,fileMap
      ,cellPanel  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
    );

    var table=this.Create.createTable(2).addAll([
      thead
      ,tbody
    ]).setClass("data "+this.classId);

    table.tbody=tbody;

    //table.setPosition(Constants.Properties.ABSOLUTE);
    //thead.setBorder(Constants.Borders.BLUE);
    //tbody.setBorder(Constants.Borders.BLACK);

    return table;

    // We need to select the first items in the left and right pane, for the copy and move buttons to work. Temporary.
    if(!this.tableRow){
      this.selectLeft();
    }else{
      this.selectRight();
    }

    this.mouseDownTableRow(null,tbody.firstChild,div); // This selects the first row of the first table.
    //this.mouseDownTableRow(null,tbody.getFirstChild,div); // This selects the first row of the first table.

    /*
    // Select the first row.
    //if(!this.selectedTr)this.mouseDownTableRow(null,table.tbody.firstChild,(div||this.selectedDivFiles)); // This selects the first row of the first table.
    if(!this.tableRow){
      this.selectLeft();
      //this.mouseDownTableRow(null,table.tbody.firstChild,(div||this.divFiles)); // This selects the first row of the first table.
    }else{
      this.selectRight();
      //this.mouseDownTableRow(null,table.tbody.firstChild,(div||this.divFiles)); // This selects the first row of the first table.
      this.selectLeft();
      //this.mouseDownTableRow(null,table.tbody.firstChild,(div||this.divFiles)); // This selects the first row of the first table.
    }
    */

    return table;
  }

  ,createThead:function(){
    Ispaces.logger.debug(this.id+'.createThead()');

    var _this=this

    /*
     * DOM Creation Functions
     */
    ,Create=_this.Create
    ,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    ,createDivTable=Create.createDivTable
    ,createTableHeader=Create.createTableHeader

    /*
     * Events
     */
    ,Events=Constants.Events
    ,CLICK=Events.CLICK
    ,MOUSEDOWN=Events.MOUSEDOWN
    ,MOUSEUP=Events.MOUSEUP
    ,MOUSEMOVE=Events.MOUSEMOVE
    //,TOUCHSTART=Events.TOUCHSTART // mousedown or touchstart
    //,TOUCHEND=Events.TOUCHEND // mouseup or touchend
    //,TOUCHMOVE=Events.TOUCHMOVE // mousemove or touchmove
    ;


    var header
    ,headers=this.headers
    /*
    //,DEFAULT_COLUMN_WIDTHS:[250,77,100]
    ,headers=[
      {title:"Name",name:'name',w:250}
      ,{title:"Size",name:'size',w:75}
      ,{title:"Date",name:'date',w:120}
      ,{title:Constants.Characters.NBSP,name:Constants.Characters.EMPTY,w:Common.getWindowWidthHeight()[0]}
    ]
    ,headers=[
      {
        name:'isChecked'
        ,title:''
        ,type:Constants.Tags.CHECKBOX
        //,fn:function(){_this.toggleCheckAll(Constants.Attributes.ID,this.isChecked)}
        //,fn:_this.toggleCheckAll.bind(_this,Constants.Attributes.ID)
      }
      //,{name:'status',title:'Status',colspan:2} // colspan cannot work with table-layout:fixed
      ,{name:'status',title:'Status'}
      ,{name:'name',title:'Name'}
      ,{name:'email',title:'E-mail'}
      ,{name:'location',title:'Location'}
      //,{name:'dateCreated',title:'Added'}
      //,{name:'timeCreated',title:'Added'}
      ,{name:"timeCreated",title:'Added'}
      //,{title:'Name',name:"_name",wi:100,resizable:true,sortable:true}
      //,{title:'iSpaces Name',name:"_username",wi:150,resizable:true,sortable:true}
      //,{title:'Location',name:"_location",wi:150,resizable:true,sortable:true}
      //,{title:NBSP,name:'',wi:150,colspan:3}
    ]
    */

    /*
     * DOM Elements
     */
    ,input
    ,inputCell
    ,cellTitle
    ,divRow
    ,divTable

    /*
     * References & Variables
     */
    ,i=0
    ,z=headers.length
    ,tableHeader
    ,tableHeaders=[] // an array of th elements @see
    //,a // an array for the inner th elements
    //,checkbox
    //,checkboxCell
    //,cellTitle
    ,w // width
    //,title
    //,colspan
    //,columnWidths=this.columnWidths
    ;

    var grabberWidth=4;

    for(i;i<z;i++){

      header=headers[i]
      ,title=header.title
      //,w=columnWidths[i]
      ,_width=header._width
      //,colspan=header.colspan
      ,a=[] // an array for the inner th elements
      ;

      //divRow=Create.createDivRow();
      //tableHeader=Create.createTableHeader();

      //Ispaces.logger.debug(this.id+'.createThead(): w = '+w);

      if(i>0){ // Only add the column resizer after the first column.

        /*
        var leftGrabberInnerDiv=createDiv().setClass("inside")
        ,leftGrabber=createDivCell(leftGrabberInnerDiv).setClass("leftgrab") // The column resizer grabber.
        ;
        */
        var grabberInner=_this.createTableHeaderGrabber().setClass("inside");
        var leftGrabber=createDivCell(grabberInner).setClass("leftgrab"); // The column resizer grabber.

        a.push(leftGrabber);

        var newLeftWidth
        ,newRightWidth
        ;

        leftGrabber.addListener(
          MOUSEDOWN // mousedown or touchstart
          ,function(e){
            Ispaces.logger.debug('leftGrabber.'+MOUSEDOWN+'('+e+')');

            var tableHeader=this.tableHeader;
            if(!tableHeader.resizeColumnFunction){

              //Ispaces.global.mouseUpObject=_this; // Global catch-all object.
              //Ispaces.global.mouseUpFunction=_this.mouseUp.bind(this,tableHeader); // Global catch-all object.
              //Ispaces.global.mouseUpFunction=_this.mouseUpLeftGrabber.bind(_this,leftGrabber)
              //Ispaces.global.mouseUpFunction=_this.mouseUpLeftGrabber.bind(_this,this);
              Common.setMouseUpFunction(_this.mouseUpLeftGrabber.bind(_this,this));

              var mouseDownX=Common.getMouseX(e);
              //Ispaces.logger.debug('mouseDownX = '+mouseDownX);

              var tableHeaderPrevious=tableHeader.previousSibling;
              var tableHeaderWidth=Common.getWidth(tableHeaderPrevious);

              //Ispaces.logger.debug('tableHeaderPrevious = '+tableHeaderPrevious);
              //Ispaces.logger.debug('tableHeaderWidth = '+tableHeaderWidth);

              // Important - Before resizing colums, the enclosing columnCells needs overflow:hidden for the center colum resizing to work.
              tableHeaderPrevious.setOverflow(Constants.Properties.HIDDEN);

              var mouseX
              ,mouseMovedX
              ;

              Common.addListener(
                document
                ,MOUSEMOVE // can be mousemove or touchmove
                ,tableHeader.resizeColumnFunction=function(e){

                  mouseX=Common.getMouseX(e)
                  ,mouseMovedX=(mouseX-mouseDownX)
                  ,newLeftWidth=tableHeaderWidth+mouseMovedX
                  ;

                  //Ispaces.logger.debug('mouseX = '+mouseX);
                  //Ispaces.logger.debug('mouseMovedX = '+mouseMovedX);
                  //Ispaces.logger.debug('newLeftWidth = '+newLeftWidth);

                  /*
                  tableHeaderPrevious.setWidthPixels(newLeftWidth)
                  ,tableHeaderPrevious.setMinWidth(newLeftWidth)
                  ,tableHeaderPrevious.setMaxWidth(newLeftWidth)
                  //,divFilesLeft.setWidthPixels(divFilesLeft.w+mouseMovedX)
                  ;
                  */
                  tableHeaderPrevious.fixedWidth(newLeftWidth);
                }
              );

            } // if(!tableHeader.resizeColumnFunction)

            //Common.stopEventPropagation(e); // Prevent the drag from doing a selection.
            Common.killEvent(e); // Prevent the drag from doing a selection.
            return false; // Prevent the mouse down from initiating a selection.
          }
        ); // leftGrabber.addListener(TOUCHSTART,...

        leftGrabber.addListener(MOUSEUP,_this.mouseUpLeftGrabber.bind(_this,leftGrabber));

        leftGrabber.addListener(
          CLICK
          ,function(e){Common.stopEventPropagation(e)}
          //,function(e){Common.killEvent(e)}
        );
      } // if(i>0)


      /*
      if(header.type==Constants.Tags.CHECKBOX){
        checkbox=Common.Create.createInput(
          Constants.Tags.CHECKBOX
          ,header.name
          ,Constants.Characters.EMPTY
          ,header.fn
        );
        checkbox.addListener(
          CLICK
          ,_this.toggleCheckAll.bind(
            _this
            ,checkbox
          )
        );
        checkboxCell=createDivCell(checkbox).setClass("input");
        a.push(checkboxCell);
      }else{
        cellTitle=createDivCell(createTextNode(title)).setClass("text");
        a.push(cellTitle);
      }
      */
      //cellTitle=createDivCell(createTextNode(title)).setClass("text");
      //a.push(cellTitle);
      //cellTitle=Create.createDivCell(Create.createTextNode(title)).setClass("text")
      cellTitle=createDivCell(createTextNodeI18n(title)).setClass("text");

      //divRow.add(cellTitle);
      a.push(cellTitle);

      downCell=createDivCell(createTextNode('6')).setClass("down");
      a.push(downCell);


      /* The spacer cell is added above: //,{title:Constants.Characters.NBSP,name:Constants.Characters.EMPTY,w:Common.getWindowWidthHeight()[0]}
      var rightGrabberInnerDiv=Create.createDiv().setClass("inside")
      ,rightGrabber=createDivCell(rightGrabberInnerDiv).setClass("rightgrab") // The left column resize grabber.
      ;

      a.push(rightGrabber);

      //var newLeftWidth,newRightWidth;
      rightGrabber.addListener(
        MOUSEDOWN // can be mousedown or touchstart
        ,function(e){
          Ispaces.logger.debug('rightGrabber.'+MOUSEDOWN+'('+e+')');

          var tableHeader=_this.tableHeader;

          if(!tableHeader.resizeColumnFunction){

            //Ispaces.global.mouseUpObject=_this; // Global catch-all object.

            var mouseDownX=Common.getMouseX(e);
            var tableHeaderWidth=Common.getWidth(tableHeader);

            //Ispaces.logger.debug('mouseDownX = '+mouseDownX);
            //Ispaces.logger.debug('tableHeaderWidth = '+tableHeaderWidth);

            // Important - Before resizing colums, the enclosing columnCells needs overflow:Hidden for the center colum resizing to work.
            //columnLeft.setOverflow(Constants.Properties.HIDDEN);
            //columnRight.setOverflow(Constants.Properties.HIDDEN);

            //var divFilesLeft=columnLeft.divFiles;
            //var divFilesRight=columnRight.divFiles;
            //divFilesLeft.w=Common.getWidth(divFilesLeft);
            //divFilesRight.w=Common.getWidth(divFilesRight);

            var mouseX
            ,mouseMovedX
            ;

            Common.addListener(
              document
              //,TOUCHMOVE // can be mousemove or touchmove
              ,MOUSEMOVE // can be mousemove or touchmove
              ,tableHeader.resizeColumnFunction=function(e){

                //var mouseX=Common.getMouseX(e);
                //var mouseMovedX=(mouseX-mouseDownX);
                mouseX=Common.getMouseX(e)
                ,mouseMovedX=(mouseX-mouseDownX)
                ,newLeftWidth=tableHeaderWidth+mouseMovedX
                ;

                //Ispaces.logger.debug('mouseX = '+mouseX);
                //Ispaces.logger.debug('mouseMovedX = '+mouseMovedX);
                //Ispaces.logger.debug('newLeftWidth = '+newLeftWidth);

                //tableHeader.setWidthPixels(newLeftWidth),tableHeader.setMinWidth(newLeftWidth),tableHeader.setMaxWidth(newLeftWidth);//,divFilesLeft.setWidthPixels(divFilesLeft.w+mouseMovedX);
                //tableHeader.setWidthPixels(newLeftWidth),tableHeader.setMinWidth(newLeftWidth),tableHeader.setMaxWidth(newLeftWidth);//,divFilesLeft.setWidthPixels(divFilesLeft.w+mouseMovedX);
                tableHeader.fixedWidth(newLeftWidth);
              }
            );

          } // if(!tableHeader.resizeColumnFunction)

          //Common.stopEventPropagation(e); // Prevent the drag from doing a selection.
          Common.killEvent(e); // Prevent the drag from doing a selection.
          return false; // Prevent the mouse down from initiating a selection.
        }
      );

      rightGrabber.addListener(MOUSEUP,_this.mouseUpRightGrabber.bind(_this,rightGrabber));
      rightGrabber.addListener(
        CLICK
        ,function(e){Common.stopEventPropagation(e)}
        //,function(e){Common.killEvent(e)}
      );
      //*/

      //Ispaces.logger.debug(_this.id+'.createThead(): a.length = '+a.length);

      divRow=createDivRow(a)
      ,divTable=createDivTable(divRow).setClass("table")
      ,tableHeader=createTableHeader(divTable)
      ;

      tableHeader.index=i; // @see mouseUpLeftGrabber()
      tableHeader.name=header.name;
      tableHeader.downCell=downCell;
      if(leftGrabber)leftGrabber.tableHeader=tableHeader; // Set a reference to the tableHeader on the leftGrabber. @see leftGrabber.mousedown(). if(leftGrabber) - The leftGrabber is not present in the first column.
      //rightGrabber.tableHeader=tableHeader;

      /*
      //if(w)tableHeader.setWidthPixels(w);
      //if(w)tableHeader.fixedWidth(w);
      //if(colspan)tableHeader.setAttribute('colspan',colspan);
      if(colspan){
        Ispaces.logger.debug(_this.id+'.createThead(): colspan = '+colspan);
        //tableHeader['colspan']=colspan;
        //tableHeader.setAttribute('colSpan',3);
        tableHeader.colSpan=colspan;
        //tableHeader.colSpan=3;
        //tableHeader['colSpan']="3";
        Ispaces.logger.debug(_this.id+'.createThead(): tableHeader.colSpan = '+tableHeader.colSpan);
      }
      */
      if(_width)tableHeader.fixedWidth(_width);

      tableHeader.addListener(CLICK,_this.clickTableHeader.bind(_this,tableHeader));

      tableHeaders.push(tableHeader);
    } // for(i;i<z;i++)

    /*
     * Add an extra column at the end with a width set to the width of the window, so that the table with table-layout:fixed; can extend past the full width of the window.
     */
    /*
    //tableHeader=createTableHeader();
    var leftGrabberInnerDiv=createDiv().setClass("inside")
    ,leftGrabber=createDivCell(leftGrabberInnerDiv).setClass("leftgrab") // The column resizer grabber.
    ;

    divRow=createDivRow(leftGrabber)
    ,divTable=createDivTable(divRow).setClass("table")
    ,tableHeader=createTableHeader(divTable)
    ;

    tableHeader=createTableHeader(divTable);

    leftGrabber.tableHeader=tableHeader;

    leftGrabber.addListener(
      MOUSEDOWN // mousedown or touchstart
      ,function(e){
        Ispaces.logger.debug('leftGrabber.'+MOUSEDOWN+'('+e+')');
        var tableHeader=_this.tableHeader;
        if(!tableHeader.resizeColumnFunction){
          var mouseDownX=Common.getMouseX(e);
          //Ispaces.logger.debug('mouseDownX = '+mouseDownX);
          var tableHeaderPrevious=tableHeader.previousSibling;
          var tableHeaderWidth=Common.getWidth(tableHeaderPrevious);
          //Ispaces.logger.debug('tableHeaderPrevious = '+tableHeaderPrevious);
          //Ispaces.logger.debug('tableHeaderWidth = '+tableHeaderWidth);
          // Important - Before resizing colums, the enclosing columnCells needs overflow:hidden for the center colum resizing to work.
          tableHeaderPrevious.setOverflow(Constants.Properties.HIDDEN);
          var mouseX
          ,mouseMovedX
          ;
          Common.addListener(
            document
            ,MOUSEMOVE // can be mousemove or touchmove
            ,tableHeader.resizeColumnFunction=function(e){

              mouseX=Common.getMouseX(e)
              ,mouseMovedX=(mouseX-mouseDownX)
              ,newLeftWidth=tableHeaderWidth+mouseMovedX
              ;

              //Ispaces.logger.debug('mouseX = '+mouseX);
              //Ispaces.logger.debug('mouseMovedX = '+mouseMovedX);
              //Ispaces.logger.debug('newLeftWidth = '+newLeftWidth);

              //tableHeaderPrevious.setWidthPixels(newLeftWidth)
              //,tableHeaderPrevious.setMinWidth(newLeftWidth)
              //,tableHeaderPrevious.setMaxWidth(newLeftWidth)
              //;
              tableHeaderPrevious.fixedWidth(newLeftWidth);
            }
          );
        } // if(!tableHeader.resizeColumnFunction)
        //Common.stopEventPropagation(e); // Prevent the drag from doing a selection.
        Common.killEvent(e); // Prevent the drag from doing a selection.
        return false; // Prevent the mouse down from initiating a selection.
      }
    ); // leftGrabber.addListener(TOUCHSTART,...

    leftGrabber.addListener(MOUSEUP,_this.mouseUpLeftGrabber.bind(_this,leftGrabber));

    leftGrabber.addListener(
      CLICK
      ,function(e){Common.stopEventPropagation(e)}
      //,function(e){Common.killEvent(e)}
    );

    //Ispaces.logger.warn(_this.id+'.createThead(): tableHeader.width = "'+tableHeader.width+'" - thead.width is deprecated. Use style.width instead.');
    //tableHeader.width(Common.getWindowWidthHeight()[0]); // Conflict! thead.width is causing a proplem. thead.width is deprecated. Use style.width instead.
    //tableHeader.style[WIDTH]=Common.getWindowWidthHeight()[0]+'px'; // Temporary fix.
    tableHeader.setWidthPixels(Common.getWindowWidthHeight()[0]); // Conflict! thead.width is causing a proplem. thead.width is deprecated. Use style.width instead.
    tableHeaders.push(tableHeader);
    //*/

    //Ispaces.logger.debug('tableHeaders.length = '+tableHeaders.length);

    var tableRow=Create.createTableRow(tableHeaders);

    var thead=Create.createElement(Constants.Tags.THEAD).add(tableRow);

    //_this.tableHeaders=tableHeaders; // Set a reference to the table headers on the ContactManager object. @see sortTable()
    //thead.tableHeaders=tableHeaders; // Set a reference to the table headers on the thead object. @see sortTable()

    return thead;
  }

  ,createTbody:function(
    isLocal
    ,protocol
    ,path
    ,fileMap
    ,cellPanel  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
  ){
    Ispaces.logger.debug(this.id+'.createTbody(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileMap:'+Common.getSize(fileMap)+')');

    /*
     * DOM Creation Functions
     */
    var _this=this
    ,Create=_this.Create
    ,createTableRow=Create.createTableRow
    ,createTableCell=Create.createTableCell
    //,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    ,createDivTable=Create.createDivTable
    ,createTextNode=Create.createTextNode

    /*
     * Constants
     */
    ,ON=Constants.Strings.ON
    ,OFF=Constants.Strings.OFF
    ,Events=_this.Events
    ,MOUSEDOWN=Events.MOUSEDOWN
    ,MOUSEUP=Events.MOUSEUP
    ,CONTEXTMENU=Events.CONTEXTMENU
    //,DBLCLICK=Events.DBLCLICK // Not currently being used.
    ,SELECTED="selected"

    /*
     * DOM Elements
     */
    ,tbody=Create.createElement(Constants.Tags.TBODY)
    ,tableRow
    ,tableCell
    ,tableCellSpacer
    ,input

    /*
     * References
     */
    ,file
    ,fileName
    ,_size
    //,dateTimeISO8601
    ,date
    ,fullPath
    ,filePath

    /*
     * Split the file listing into folders and files.
     */
    ,folders=[]
    ,files=[]

    /*
     * Column Widths
     */
    ,headers=_this.headers
    ,headerWidth0=headers[0]._width
    ,headerWidth1=headers[1]._width
    ,headerWidth2=headers[2]._width
    ,windowWidth=Common.getWindowWidthHeight()[0]
    ;

    //var clone;
    //var currentPath=_this.getFilePath(root.protocol,path,EMPTY);
    //tbody.currentPath=currentPath;

    /*
     * Is this a non-root folder.
     * Add the "up" folder (..)
     */

    //*
    var atRoot=path==Constants.Characters.FORWARDSLASH;
    Ispaces.logger.debug('atRoot = '+atRoot);

    if(!atRoot){ // If not at the root, add an up arrow folder for the .. command.

      //fileMap['..']=undefined; // file is polymorpic. It can be an integer, array or object.
      fileMap['..']=0; // file is polymorpic. It can be an integer, array or object.

      //var isDir=!file||isObject(file);
      //var isDir=!file||!Common.isArray(file);
      //Ispaces.logger.debug('isDir = '+isDir);
    }
    //*/

    /*
    //if(path!=Constants.Characters.FORWARDSLASH){ // If we are not at the root dir, the first row is "..".
    if(false){ // If we are not at the root dir, the first row is "..".

      //var parentNameAndPath=_this.getParentNameAndPath(path);
      var parentNameAndPath=_this.getParentNameAndPath(path);
      //Ispaces.logger.debug('parentNameAndPath = '+parentNameAndPath);

      //var mimeType=Ispaces.mimeTypes.getMimeType("folderup");
      //var cellIcon=createDivCell(createTextNode(mimeType.charIcon)).setClass("icon");
      ////cellIcon.setClass(mimeType.id);
      ////cellIcon.addClass("folder");
      var cellIcon=createDivCell(createTextNode('$')).setClass("icon");

      //var cellFileName=createDivCell(createTextNode(_this.squareBrackets('..')));
      var cellFileName=createDivCell(createTextNode('..'));
      //cellFileName.alignMiddle();
      cellFileName.setFontSize(20);

      var divTable=createDivTable(
        createDivRow([
          cellIcon
          ,cellFileName
        ])
      );

      //tableCell.add(divTable);
      tableCell=createTableCell(divTable);
      //tableRow.add(tableCell);
      //tableRow=createTableRow();
      tableRow=createTableRow(tableCell);

      tableRow.protocol=protocol; // Set the 'protocol' as a property of the table row. @see doubleClickTableRow
      tableRow.path=parentNameAndPath[1]; // Set the 'path' as a property of the table row. @see doubleClickTableRow
      tableRow.fileName=parentNameAndPath[0]; // Set the fileName property of this table row to be the filename.
      //tableRow.filePath=filePath; // Set the URL. Used for launching the application by file name when double clicking.
      tableRow.isDir=true;
      tableRow.isLocal=isLocal;

      // Event handlers.
      //tableRow.addListener(CONTEXTMENU,_this.showFileContextMenu.bind(_this));
      //tableRow.addListener(DBLCLICK,_this.doubleClickTableRow.bind(_this,tableRow)); // This does not include touch support.
      Common.addDoubleClick(tableRow,_this.doubleClickTableRow.bind(_this,tableRow));  // Adding the double click handler in the way, does support touch.
      tableRow.addListener(MOUSEDOWN,_this.mouseDownTableRow.bind(_this,tableRow));
      //tableRow.addListener(MOUSEUP,function(e){Common.stopEventPropagation(e);return false;}); // Prevent the mouseup from propogaqting to the panel.
      //tableRow.addListener(MOUSEUP,Common.killEvent.bind(Common)); // Prevent the mouseup from propogating to the panel.
      //tableRow.addListener(MOUSEUP,function(e){
      //  Ispaces.logger.debug('tableRow.mouseup('+e+')');
      //  Ispaces.logger.alert('tableRow.mouseup('+e+')');
      //  Common.stopEventPropagation(e); // Prevent the mouseup from propogating to the panel.
      //  Ispaces.logger.debug('this.mouseMoveFunction = '+this.mouseMoveFunction);
      //  if(this.mouseMoveFunction){  // this = table row element [HTMLTableRowElement]
      //    Common.removeListener(
      //      document
      //      ,_this.Events.MOUSEMOVE
      //      ,this.mouseMoveFunction
      //    );
      //    this.mouseMoveFunction=null;
      //  }
      //  return false; // Prevent the mouseup from propogating to the panel.
      //});
      tableRow.addListener(MOUSEUP,_this.mouseUpTableRow.bind(_this,tableRow));

      // Add two empty cells for the 'size' and 'date'.
      tableRow.addAll([
        createTableCell()
        ,createTableCell()
      ]);

      // Add an extra spacer cell for the look, so it extends any visual lines.
      tableCellSpacer=createTableCell();
      tableCellSpacer.setWidthPixels(windowWidth);
      tableRow.add(tableCellSpacer);

      tbody.add(tableRow);
    }
    //*/

    if(fileMap){

      Ispaces.logger.debug('fileMap = '+fileMap);

      var x=0; // Used to set the stripes.

      var killEvent=Common.killEvent.bind(Common); // Prevent a double click text selection ??

      for(fileName in fileMap){

        file=fileMap[fileName]; // file is polymorpic. It can be an integer, array or object.
        //,isChecked=file[INDEX_CHECKED] // Is this contact checked in the UI checkbox?

        //var isDir=!file||isObject(file);
        var isDir=!file||!Common.isArray(file);
        //Ispaces.logger.debug('isDir = '+isDir);

        //fullPath=_this.getFullPath(path,fileName);
        //fullPath=_this.getFilePath(protocol,path,fileName);
        //Ispaces.logger.debug('fullPath = '+fullPath);
        //filePath=_this.getFilePath(root,path,fileName);
        filePath=_this.getFilePath(protocol,path,fileName);
        //Ispaces.logger.debug('filePath = '+filePath+', file = '+file);

        Ispaces.logger.debug('filePath = "'+filePath+'"');

        //clone=root.clone();
        //clone.path=fullPath;
          //log.object(clone);

        tableRow=createTableRow();

        //new DraggableClone(tableRow);
        //tableRow.root=clone;
        tableRow.protocol=protocol; // Set the 'protocol' as a property of the table row. @see doubleClickTableRow
        tableRow.path=path; // Set the 'path' as a property of the table row. @see doubleClickTableRow
        tableRow.fileName=fileName; // Set the fileName property of this table row to be the filename.
        tableRow.filePath=filePath; // Set the URL. Used for launching the application by file name when double clicking.
        tableRow.isLocal=isLocal;

        /*
        //if(isChecked){
        //  tableRow.cssName=SELECTED;
        //}else{
          if(x++%2==0){
            tableRow.cssName=ON; // Set the className as a reference on the tableRow, so it can be switched and restored.
          }else{
            tableRow.cssName=OFF;
          }
        //}
        tableRow.setClass(tableRow.cssName);
        //*/

        //tableRow.addListener(CONTEXTMENU,_this.showFileContextMenu.bind(_this));
        tableRow.addListener(CONTEXTMENU,_this.showContextMenu.bind(_this,"DesktopFile"));

        tableRow.addListener(MOUSEDOWN,_this.mouseDownTableRow.bind(_this,tableRow));
        //tableRow.addListener(MOUSEUP,Common.killEvent.bind(Common)); // Prevent the mouseup from propogating to the panel.
        //tableRow.addListener(MOUSEUP,killEvent); // Prevent the mouseup from propogating to the panel.
        tableRow.addListener(MOUSEUP,_this.mouseUpTableRow.bind(_this,tableRow));

        if(isDir){  // A path is either a file or a folder (directory).

          tableRow.isDir=true;

          //tableRow.addListener(DBLCLICK,_this.doubleClickTableRow.bind(_this,tableRow));  // Does not support touch double click.
          Common.addDoubleClick(tableRow,_this.doubleClickTableRow.bind(_this,tableRow));   // Support for touch double click.

          var mimeType=Ispaces.mimeTypes.getMimeType("folder"); // "folder" can be obfuscated here @see MimeTypes.mimeTypes["folder"]

          //var cellIcon=createDivCell();
          var cellIcon=createDivCell(createTextNode(mimeType.charIcon)).setClass("icon");
          //var divIcon=createDiv(createTextNode(mimeType.charIcon)).setClass("icon");
          //var cellIcon=createDivCell(divIcon).setClass("cell-icon");
          //cellIcon.setMinWidthHeight(16);
          //cellIcon.setMargin(_0);
          //cellIcon.setPaddingLeft(2);
          //cellIcon.setPadding('0 0 0 2px');
          //cellIcon.setClass(mimeType.id);
          cellIcon.addClass("folder");

          //var cellFileName=createDivCell(createTextNode(_this.squareBrackets(fileName)));
          var cellFileName=createDivCell(createTextNode(fileName));

          var divTable=createDivTable(
            createDivRow([
              cellIcon
              ,cellFileName
            ])
          );//.setClass('table-file');

          tableCell=createTableCell(divTable);

          tableRow.add(tableCell);

          tableRow.cellFileName=cellFileName; // Set a reference to the cellFileName for renaming.
          //cellFileName.alignMiddle();

          //divTable.setBorder(RED);
          //divTable.setMargin(_0);
          //divTable.setPadding(_0);

          //tableCell.setBorder(GREEN);
          //tableCell.add(divTable);
          //tableCell.setWidthPixels(_this.headerWidth[0]);
          //tableCell.setMinWidth(_this.headerWidth[0]);
          //tableCell.setMaxWidth(_this.headerWidth[0]);
          tableCell.fixedWidth(headerWidth0);
          //tableRow.add(createTableCell(divTable));

          /*
          tableRow.add(cE(TD));
          tableRow.add(cE(TD));
          */
          //tableRow.add(createTableCell());
          //tableRow.add(createTableCell());
          tableRow.addAll([
            createTableCell()
            ,createTableCell()
          ]);

        }else{ // if(isDir) - else not a directory.

          //dateVar = new Date(year, month, date[, hours[, minutes[, seconds[,ms]]]]);

          //_size=file[0];
          //dateTimeISO8601=file[1]; // ISO8601
          //date=new Date(dateTimeISO8601);
          //date=Ispaces.DateUtil.parseISO8601(dateTimeISO8601);
          //date=Ispaces.DateUtil.isoToDate(dateTimeISO8601);
          //size=Ispaces.StringFormat.bytesToSize(file[0],1);
          //size=Ispaces.StringFormat.addCommas(file[0]);
          size=Ispaces.StringFormat.addCommasBytes(file[0]);
          date=Ispaces.DateUtil.isoToUsa(file[1]);

          tableRow._size=size;

          //Ispaces.logger.debug('dateTimeISO8601 = '+dateTimeISO8601);
          //Ispaces.logger.debug('date.toUTCString() = '+date.toUTCString());
          //Ispaces.logger.debug('date.toString() = '+date.toString());
          //Ispaces.logger.debug('date.toLocaleString() = '+date.toLocaleString());

          /*
          tableRow.addListener(
            DBLCLICK
            ,function(e){
              Ispaces.Launcher.launchFileName(_this,e);
              preventDefaultEvent(e);
            }
          );
          */
          //tableRow.addListener(DBLCLICK,_this.doubleClickTableRow.bind(_this,tableRow));
          Common.addDoubleClick(tableRow,_this.doubleClickTableRow.bind(_this,tableRow));

          // Get the mime type icon.
          var extension=Ispaces.Launcher.getExtension(fileName);
          //Ispaces.logger.debug('extension = "'+extension+'"');

          //var mimeType=Ispaces.MimeTypes.mimeTypes[extension];
          var mimeType=Ispaces.mimeTypes.getMimeType(extension); // If the extension is not defined, this call returns the default ('') empty string mimetype.
          //Ispaces.logger.debug('mimeType = '+mimeType);

          //if(!mimeType)mimeType=Ispaces.MimeTypes.mimeTypes["default"]; // default cannot / should not be obfuscated
          //if(!mimeType)mimeType=Ispaces.MimeTypes.mimeTypes[Constants.Characters.EMPTY]; // use empty instead
          //if(!mimeType)mimeType=Ispaces.mimeTypes.getMimeType(Constants.Characters.EMPTY); // use empty instead

          //var cellIcon=createDivCell();
          //var cellIcon=createDivCell().setClass("icon");
          //var cellIcon=createDivCell(mimeType.charIcon).setClass("icon");
          var cellIcon=createDivCell(createTextNode(mimeType.charIcon)).setClass("icon");
          //cellIcon.setMinWidthHeight(16);
          //cellIcon.setPaddingLeft(2);
          //cellIcon.setPadding('0 0 0 2px');
          //cellIcon.setClass(mimeType.id);
          //cellIcon.addClass(extension); // extension not obfuscated
          //cellIcon.setClass(mimeType.extension);
          if(mimeType.extension){
            cellIcon.addClass(mimeType.extension);
          }else{
            if(extension)cellIcon.addClass(extension); // extension not obfuscated
          }

          var cellFileName=createDivCell(createTextNode(fileName));

          //cellFileName.alignMiddle();
          tableRow.cellFileName=cellFileName;

          var divTable=createDivTable(
            createDivRow([
              cellIcon
              ,cellFileName
            ])
          );

          tableCell=createTableCell(divTable);
          //tableCell.setWidthPixels(_this.headerWidth[0]);
          //tableCell.setMinWidth(_this.headerWidth[0]);
          //tableCell.setMaxWidth(_this.headerWidth[0]);
          tableCell.fixedWidth(headerWidth0);
          tableRow.add(tableCell);
          //tableRow.add(createTableCell(divTable));

          // Size
          tableCell=createTableCell(createTextNode(size)).setClass("right");
          tableCell.fixedWidth(headerWidth1);
          tableRow.add(tableCell);

          // Date
          tableCell=createTableCell(createTextNode(date)).setClass("right");
          tableCell.fixedWidth(headerWidth2);
          tableRow.add(tableCell);
        }

        /*
         * Add an extra spacer cell for the look, so it extends any visual lines.
         */
        //*
        tableCellSpacer=createTableCell();
        tableCellSpacer.setWidthPixels(windowWidth);
        tableRow.add(tableCellSpacer);
        //*/

        //tbody.add(tableRow);
        if(isDir){ // Split the file listing out into folders and files.
          folders.push(tableRow);
        }else{
          files.push(tableRow);
        }

      } // for(fileName in fileMap)

      tbody.addAll(folders).addAll(files); // Add the folders first, then the files.

      // Add drop targets on the folders.
      //this.addDropFolders(folders); // Add drop targets on the folders.
      //cellPanel.dropFolders=folders; // Add drop targets on the folders.  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
      var dropFolders=cellPanel.dropFolders;
      if(!dropFolders)dropFolders=cellPanel.dropFolders=[];
      dropFolders.addAll(folders); // Add drop targets on the folders.  // Also pass in the cellPanel so the dropFolders can be set as a property of it.

    } // if(fileMap)

    /*
    tbody.addListener(
      'overflow'
      ,function(e){
        Ispaces.logger.debug('tbody.overflow('+e+')');

        switch(e.detail){
          case 0:
            Ispaces.logger.debug('The vertical scrollbar has appeared.');
            break;
          case 1:
            Ispaces.logger.debug('The horizontal scrollbar has appeared.');
            break;
          case 2:
            Ispaces.logger.debug('The horizontal and vertical scrollbars have both appeared.');
            break;
        }
      }
    );
    tbody.addListener(
      'scroll'
      ,function(e){
        Ispaces.logger.debug('tbody.scroll('+e+')');
      }
    );
    //*/

    return tbody;
  }

  //,squareBrackets:function(s){return Constants.Characters.LEFTSQUARE+s+Constants.Characters.RIGHTSQUARE;}

  ,createTableHeaderGrabber:function(){
    //Ispaces.logger.debug(this.id+'.createTableHeaderGrabber()');

    var Create=Common.Create
    ,createDivCell=Create.createDivCell
    ;

    var cellLeft=createDivCell().setClass("left-inside")
    ,cellRight=createDivCell().setClass("right-inside")
    ;

    var divRow=Create.createDivRow([
      cellLeft
      ,cellRight
    ]);

    return Create.createDivTable(divRow);
  }


  /*
  ,selectTableRow:function(tableRow){
    Ispaces.logger.debug(this.id+'.selectTableRow(tableRow:'+tableRow+')');

    tableRow.setClass('selected');
    tableRow.on=true;
    this.tableRow=tableRow;
    this.checkCheckbox(tableRow.divCheckbox);
    this.tableRows.push(tableRow);
  }

  ,deselectTableRow:function(tableRow){
    Ispaces.logger.debug(this.id+'.deselectTableRow(tableRow:'+tableRow+')');

    tableRow.on=false;
    tableRow.setClass(tableRow._className);
    this.uncheckCheckbox(tableRow.divCheckbox);
    this.tableRows.removeNode(tableRow);
  }
  */

  ,tile:function(o){
    Ispaces.logger.debug(this.id+'.tile('+o+')');

    var cellPanel=o.cellPanel
    ,protocol=o.protocol
    //,divFiles=cellPanel.divFiles
    ,cellFiles=cellPanel.cellFiles
    ,refresh=o.refresh
    ,isLocal=cellPanel.isLocal
    ,filePath=o.filePath
    ;

    Ispaces.logger.debug('cellPanel = '+cellPanel);
    Ispaces.logger.debug('protocol = '+protocol);
    //Ispaces.logger.debug('divFiles = '+divFiles);
    Ispaces.logger.debug('cellFiles = '+cellFiles);
    Ispaces.logger.debug('refresh = '+refresh);
    Ispaces.logger.debug('isLocal = '+isLocal);
    Ispaces.logger.debug('filePath = '+filePath);

    // Clear the dropFolders
    //cellPanel.dropFolders.clear();
    cellPanel.dropFolders=[];

    /*
     * Asyncronously get the file listing using a callback.
     */
    var _this=this
    ,Constants=_this.Constants
    ,path=Constants.FORWARDSLASH
    ,fileName=Constants.EMPTY
    ;

    Ispaces.Files.getAsync(
      isLocal
      ,protocol
      ,path
      ,fileName
      ,_this.createViewTile.bind(_this,cellPanel)
      //,this.createTree.bind(this,cellPanel,isLocal,protocol,path)
      ,refresh
    );

  }

  ,createViewTile:function(
    cellPanel
    ,isLocal
    ,protocol
    ,path
    ,fileMap
  ){
    Ispaces.logger.debug(this.id+'.createViewTile(cellPanel:'+cellPanel+', isLocal:'+isLocal+', protocol:'+protocol+', path:'+path+', fileMap:'+fileMap+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    var _this=this;
    /*
     * If the fileMap being returned is a string, it is the authentication URL.
     */
    /*
    Ispaces.logger.debug('Common.isString(fileMap) = '+Common.isString(fileMap));
    if(Common.isString(fileMap)){
      this.authenticate(protocol,fileMap);
      return;
    }
    */

    /*
    var unorderedList=this.createTreeUnorderedList(
      isLocal
      ,protocol
      ,path
      ,fileMap
    );

    */

    //var divFiles=cellPanel.divFiles;
    var cellFiles=cellPanel.cellFiles;
    var divFiles;

    //Ispaces.logger.debug('divFiles = '+divFiles);
    //Ispaces.logger.debug('cellFiles = '+cellFiles);

    var widthHeight=Common.getWidthHeight(cellFiles);
    Ispaces.logger.debug('widthHeight = '+widthHeight);

    var size=Common.getSize(fileMap);
    Ispaces.logger.debug('size = '+size);

    if(size>0){

      var fileName
      ,file
      ,tile
      ,tiles=[]
      ,folders=[] // Split the file listing into folders and files.
      ,files=[]
      ,filePath
      ;

      for(fileName in fileMap){

        file=fileMap[fileName]; // file is polymorpic, it can be an 1) integer, 2) an array or 3) an object

        Ispaces.logger.debug('fileName = '+fileName+', file = '+file);

        //var isDir=!file||isObject(file);
        var isDir=!file||!Common.isArray(file);
        //Ispaces.logger.debug('isDir = '+isDir);

        //fullPath=_this.getFullPath(path,fileName);
        //fullPath=_this.getFilePath(protocol,path,fileName);
        //Ispaces.logger.debug('fullPath = '+fullPath);
        //filePath=_this.getFilePath(root,path,fileName);
        filePath=_this.getFilePath(protocol,path,fileName);
        //Ispaces.logger.debug('filePath = '+filePath+', file = '+file);

        tile=this.createTile(
          filePath
          ,fileName
          ,file
        );

        if(tile.isDir){
          folders.push(tile);
        }else{
          files.push(tile);
        }

      } // for(fileName in fileMap)

      tile.isLocal=isLocal;

      /*
       * Add the folders and files to the tiles array.
       */
      tiles.addAll(folders);
      tiles.addAll(files);
      this.tiles=tiles;
      //this.addDropFolders(folders); // Add drop targets on the folders.
      //cellPanel.dropFolders=folders; // Add drop targets on the folders.  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
      var dropFolders=cellPanel.dropFolders;
      if(!dropFolders)dropFolders=cellPanel.dropFolders=[];
      dropFolders.addAll(folderDivs); // Add drop targets on the folders.  // Also pass in the cellPanel so the dropFolders can be set as a property of it.
      Ispaces.logger.debug('dropFolders.length = '+dropFolders.length);

      /*
      if(!divFiles){
        divFiles=this.Create.createDiv(unorderedList).setClass("files");
        //divFiles.setWidthPixels(widthHeight[0]);
        divFiles.setOverflowX(Constants.Properties.HIDDEN);
        divFiles.setOverflowY(Constants.Properties.AUTO);
        cellPanel.divFiles=divFiles;
        cellFiles.replaceFirst(divFiles); // Replace the old file table with the new one.
        //cellFiles.add(divFiles); // Replace the old file table with the new one.
      }else{
        //divFiles.replaceFirst(unorderedList); // Replace the old file table with the new one.
        divFiles.removeAll();
        divFiles.add(unorderedList);
        cellPanel.viewTable.show(); // The view selector is initially hidden and gets shown when a root is selected.
      }
      cellPanel.unorderedList=unorderedList; // Set a reference to the tree on the cellPanel. @see refreshPath()
      */

      //if(!divFiles){
      if(!cellFiles){

        //divFiles=this.Create.createDiv().setClass("files");
        cellFiles=this.Create.createDiv().setClass("cell-files");

        //divFiles.setWidthPixels(widthHeight[0]);
        //divFiles.setOverflowX(Constants.Properties.HIDDEN);
        //divFiles.setOverflowY(Constants.Properties.AUTO);
        //cellPanel.divFiles=divFiles;
        cellPanel.cellFiles=cellFiles;

        //cellFiles.add(divFiles); // Replace the old file table with the new one.
        cellFiles.replaceFirst(divFiles); // Replace the old file table with the new one.

      }else{

        //divFiles.removeAll();
        cellFiles.removeAll();
        cellPanel.viewTable.show(); // The view selector is initially hidden and gets shown when a root is selected.

      }

      //cellPanel.unorderedList=unorderedList; // Set a reference to the tree on the cellPanel. @see refreshPath()

      //var divFiles=this.Create.createDiv();
      divFiles=this.Create.createDiv();
      divFiles.addAll(folders).addAll(files); // Add the folders first, then the files.

      //this.folderDiv.addAll(folders).addAll(files); // Add the folders first, then the files.
      //divFiles.addAll(folders).addAll(files); // Add the folders first, then the files.
      //cellFiles.addAll(folders).addAll(files); // Add the folders first, then the files.
      cellFiles.add(divFiles);

      cellFiles.unorderedList=divFiles;

      //this.addDropFolders(folders); // Add drop targets on the folders.

    }else{

      this.tiles=[]; // If no tiles, set this.tiles to an empty array. @see refresh()

    } // if(size>0)

    //var widthHeight=Common.getWidthHeight(cellFiles);
    //Ispaces.logger.debug('widthHeight = '+widthHeight);
    var panelWidthHeight=Common.getWidthHeight(cellPanel);
    Ispaces.logger.debug('panelWidthHeight = '+panelWidthHeight);

    //unorderedList.setOverflowX(Constants.Properties.HIDDEN);
    //unorderedList.setOverflowY(Constants.Properties.AUTO);
    /*
    divFiles.fixedHeight(panelWidthHeight[1]);
    divFiles.setOverflowX(Constants.Properties.HIDDEN);
    divFiles.setOverflowY(Constants.Properties.AUTO);
    //*/
    /*
    cellFiles.fixedHeight(panelWidthHeight[1]);
    cellFiles.setOverflowX(Constants.Properties.HIDDEN);
    cellFiles.setOverflowY(Constants.Properties.AUTO);
    //*/

    //var applicationWidthHeight=this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    var applicationWidthHeight=this.resetDimensions();
    //Ispaces.logger.debug('applicationWidthHeight = '+applicationWidthHeight);
    //this.resetDimensions();
    //this.setFileCellsHeights(applicationWidthHeight[1]);
    this.setHeightPixels(applicationWidthHeight[1]);

    //if(!isLocal)new Ispaces.AsyncApply(_this,"treeLoaded",[protocol],1);
  }

  ,createTile:function(
    filePath
    ,fileName
    ,file
  ){
    Ispaces.logger.debug(this.id+'.createTile(filePath:"'+filePath+'", fileName:"'+fileName+'", file:'+file+')');

    var _this=this
    ,Create=_this.Create
    ,createTextNode=Create.createTextNode
    ,createDiv=Create.createDiv
    ,Events=_this.Events
    ,MOUSEDOWN=Events.MOUSEDOWN
    ,CLICK=Events.CLICK
    ;

    var mimeType
    ,bytes
    ,isDir=Ispaces.Files.isDir(file)
    ;

    Ispaces.logger.debug('isDir = '+isDir);

    var tilePath=new Ispaces.StringBuilder([
      filePath
      ,_this.Constants.FORWARDSLASH
      ,fileName
    ]).asString();

    Ispaces.logger.debug('tilePath = "'+tilePath+'"');

    /*
    var checkbox=_this.Create.createElement(Constants.Tags.INPUT)
    ,divCheckbox=_this.Create.createDiv(checkbox).setClass(Constants.Properties.CHECKBOX)
    ;
    */
    /*
    var divCheckbox=Create.createDiv();
    divCheckbox.alignCenterMiddle();
    divCheckbox.setWidthHeightPixels(15);
    divCheckbox.setBackgroundColor('#fff');
    divCheckbox.style.boxShadow='inset 1px 1px 1px rgba(0,0,0,0.5)';
    divCheckbox.setPadding('1px 0px 0px 1px'); // Looks better, because of the shadow on the top-left.
    divCheckbox.setPosition(Constants.Properties.ABSOLUTE);
    divCheckbox.setPadding('1px 0px 0px 1px'); // Looks better, because of the shadow on the top-left.
    divCheckbox.setMarginTop('-24px'); // Sacred number!
    //divCheckbox.setClass(Constants.Properties.CHECKBOX);
    divCheckbox.setClass("checkbox");
    */
    var divCheckbox=createDiv().setClass("svg-checkbox checkbox");
    //var divCheckbox=createDiv().setClass("svg-checkbox");
    divCheckbox.setPosition(Constants.Properties.ABSOLUTE);
    divCheckbox.setMarginTop('-24px');
    //divCheckbox.setBackgroundColor('transparent');

    var divFileName=createDiv(createTextNode(fileName)).setClass("filename");

    var div=createDiv([
      divCheckbox
      ,divFileName
    ]);

    div.filePath=tilePath; // Set a reference...
    //div.checkbox=checkbox; // Set a reference...
    div.divCheckbox=divCheckbox; // Set a reference to the divCheckbox on the tile element, so it can be updated.
    div.isDir=isDir; // Set a reference... @see load() used to seperate files from folders for the display.
    div.fileName=fileName; // set a reference to the fileName. @see drag() & enterFolder()
    div.divFileName=divFileName; // Set a reference. @see rename()

    //checkbox.setAttribute(Constants.Attributes.TYPE,Constants.Properties.CHECKBOX);

    // Prevent the mousedown on the checkbox from initiating a drag.
    //checkbox.addListener(MOUSEDOWN,function(e){Common.stopEventPropagation(e)});

    divCheckbox.addListener(
      //MOUSEDOWN
      CLICK
      ,function(e){
        Ispaces.logger.debug('divCheckbox.mousedown('+e+')');

        Common.stopEventPropagation(e);
        //Common.killEvent(e);

        //Ispaces.logger.debug('this.isChecked = '+this.isChecked);
        if(this.isChecked){  // 'this' = divCheckbox

          var selectedDivs=_this.selectedDivs;

          selectedDivs.removeNode(div);

          /*
          div.hardChecked=true;

          div.setClass('desktopdrag');
          //div.replaceClass('desktopdrag','desktop');
          //*/

          //_this.mouseDownFile(div,e);
          //_this.selectItem(div);
          //_this.unselectItem(div);
          //div.removeClass('desktoptop'); // remove the top styling
          //div.replaceClass('desktopdrag','desktop'); // replace that drag style
          div.removeClass("checked");

          //_this.uncheckCheckbox(divCheckbox);
          _this.uncheckCheckbox(this);

        }else{

          var selectedDivs=_this.selectedDivs;
          if(!selectedDivs)selectedDivs=_this.selectedDivs=[];
          //Ispaces.logger.debug('selectedDivs.length = '+selectedDivs.length);
          selectedDivs.push(div);

          /*
          div.hardChecked=false;


          div.setClass('desktop');
          //div.replaceClass('desktop','desktopdrag');
          //*/

          //_this.mouseDownFile(div,e);

          //_this.unselectItem(div);
          //_this.selectItem(div);

          //div.replaceClass('desktop','desktopdrag');
          //div.addClass('desktoptop');
          div.addClass("checked");

          //_this.checkCheckbox(divCheckbox);
          _this.checkCheckbox(this);

        }

      }
    );

    //checkbox.addListener(
    //  Constants.Events.CHANGE
    //  ,function(e){
    //    Ispaces.logger.debug('checkbox.change('+e+')');

        /*
        var previousDiv=_this.previousDiv;
        Ispaces.logger.debug('checkbox.ch('+e+'): previousDiv = '+previousDiv);

        if(previousDiv){

          Ispaces.logger.debug('checkbox.ch('+e+'): previousDiv.hardChecked = '+previousDiv.hardChecked);

          if(!previousDiv.hardChecked){ // If the previous div is not hard checked, uncheck it.
            previousDiv.checkbox.click();
          }

        }
        previousDiv=div;
        _this.previousDiv=previousDiv;


        Common.stopEventPropagation(e);
        //checkbox.click();
        this.click();
          previousDiv.rCN('desktoptop','desktop');
          previousDiv.checkbox.click();
        }
        _this.previousDiv=this;
        */

    //  if(this.isChecked){
    //    //div.setClass('desktopdrag');
    //    div.rCN('desktop','desktopdrag');
    //    div.hardChecked=true;
    //  }else{
    //    //div.setClass('desktop');
    //    div.rCN('desktopdrag','desktop');
    //    div.hardChecked=false;
    //  }

    //  }
    //  ,false
    //);


    divCheckbox.addListener(
      MOUSEDOWN
      ,function(e){
        Common.stopEventPropagation(e);
        //Common.killEvent(e);
      }
    ); // Prevent the mousedown on the chekcbox from initiating a drag.

    div.setCursor(Constants.Properties.POINTER);
    //div.setAttribute(Constants.Attributes.NAME,'desktop');
    //div.setClass('desktoptile');
    //div.ba('#fff');

    var extension
    ,mimeType
    ;

    if(isDir){

      div.isDir=true;

      //div.setAttribute('type','folder'); // This is used to set the unicode file icon. @see MimeTypes.getChar()

      mimeType=Ispaces.mimeTypes.getMimeType("folder");

      //div._className="desktop folder";
      div._className="tile-file folder";
      div.setClass(div._className);
      //extension="folder";

    }else{

      //div.setAttribute('type','file'); // This is used to set the unicode file icon. @see MimeTypes.getChar()

      extension=Ispaces.Launcher.getExtension(fileName);
      //Ispaces.logger.debug('extension = '+extension);

      mimeType=Ispaces.mimeTypes.getMimeType(extension); // check for the extension in our list of mimetypes.
      //Ispaces.logger.debug('mimeType = '+mimeType);

      if(mimeType.extension)extension=mimeType.extension; // If the mimeType has an extension, use that instead of the parsed extension.

      div._className="tile-file "+extension;
      div.setClass(div._className);
      //Ispaces.logger.debug('div.setAttribute(\'ext\', '+extension+')');
      div.setAttribute('ext',extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()

      //bytes=file[0];
      //Ispaces.logger.debug('bytes = '+bytes);

      /*
       * Set the fileName and extension for renaming.
       */
      /*
      var fileExtension;
      var fileStem;
      var lastIndexOfDot=fileName.lastIndexOf(Constants.Characters.DOT);
      //Ispaces.logger.debug('lastIndexOfDot = '+lastIndexOfDot);
      if(lastIndexOfDot){
        fileStem=fileName.substring(0,lastIndexOfDot);
        fileExtension=fileName.substring(lastIndexOfDot+1);
      }
      //Ispaces.logger.debug('fileStem = '+fileStem);
      //Ispaces.logger.debug('fileExtension = '+fileExtension);
      div.fileStem=fileStem; // Set the stem of the file for renaming.
      div.fileExtension=fileExtension; // Set the stem of the file for renaming.
      //*/

      //div.setAttribute('ext',extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()
    }

    //div.setAttribute('ext',extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()


    //if(fileName)_this.td[fileName]=div; // Add a reference to the div to the TD for quick deletion.

    //div.fileStem=nameExt[0]; // Set the stem of the file for renaming.
    //div.extension=nameExt[1]; // Set the extension of the file for renaming.
    //div.fileName=fileName;
    //div.filePath=new Ispaces.StringBuilder([Constants.Ispaces,Constants.Characters.COLON,_this.Constants.FORWARDSLASH,Ispaces.spaces.space.id,_this.Constants.FORWARDSLASH,fileName]).asString();
    //Ispaces.logger.debug('div.filePath = '+div.filePath);
    //div.addListener(Constants.Events.DBLCLICK,Ispaces.Launcher.launchFileName.bind(Ispaces.Launcher,div));

    var Launcher=Ispaces.Launcher;

    Common.addDoubleClick(div,Launcher.launchFileName.bind(Launcher,div)); // Double Click & Double Tap.

    div.addListener(MOUSEDOWN,_this.mouseDownFile.bind(_this,div));

    div.addListener(
      Constants.Events.MOUSEUP // can be mouseup or touchend
      ,function(e){
        Ispaces.logger.debug(_this.id+': div.mouseUp('+e+')');

        Ispaces.logger.debug(_this.id+': div.mouseUp('+e+'): TBD - Removed this.z1000()');
        //this.z1000();

        //this.setClass('desktop');
        //if(!checkbox.isChecked)this.rCN('desktopdrag','desktop');

        this.dragging=false;
        //div.rel(mouseDownXY[0],mouseDownXY[1]);
        //div.rel();
        //div.po(Constants.Properties.RELATIVE);

        if(this.mouseMoveFunction){
          Common.removeListener(
            document
            ,Constants.Events.MOUSEMOVE
            ,this.mouseMoveFunction
          );
          this.mouseMoveFunction=null;
        }
        /*
        if(_this.mouseMoveFunction){
          Common.removeListener(
            document
            ,Constants.Events.MOUSEMOVE
            ,_this.mouseMoveFunction
            ,false
          );
          _this.mouseMoveFunction=null;
        }
        */
      }
    );

    div.addListener(_this.Events.CONTEXTMENU,_this.showContextMenu.bind(_this,"DesktopFile")); // TBD

    return div;
  }

  ,selectTile:function(tile){
    Ispaces.logger.debug(this.id+'.selectTile(tile:'+tile+')');

    this.selectedDivs.push(tile);
    this.selectedDiv=tile; // Set a reference to the selected tile.

    //tile.replaceClass('desktop','desktopdrag');
    //tile.addClass('desktoptop');
    tile.addClass("checked");

    //tile.checkbox.checked=true; // Check the checkbox.
    this.checkCheckbox(tile.divCheckbox); // Uncheck the checkbox.
  }

  ,unselectTile:function(tile){
    Ispaces.logger.debug(this.id+'.unselectTile(tile:'+tile+')');

    //tile.removeClass('desktoptop'); // remove the top styling
    //tile.replaceClass('desktopdrag','desktop'); // replace that drag style
    tile.removeClass("checked");

    //tile.checkbox.checked=false; // Uncheck the checkbox.
    this.uncheckCheckbox(tile.divCheckbox); // Uncheck the checkbox.
  }

  ,checkCheckbox:function(divCheckbox){
    Ispaces.logger.debug(this.id+'.checkCheckbox(divCheckbox:'+divCheckbox+')');

    divCheckbox.isChecked=true;

    var svgCheckmark=divCheckbox.svgCheckmark;
    if(!svgCheckmark){
      svgCheckmark=divCheckbox.svgCheckmark=Ispaces.Svg.createCheckmark();
      divCheckbox.add(svgCheckmark);
    }else{
      svgCheckmark.show();
    }
  }

  ,uncheckCheckbox:function(divCheckbox){
    Ispaces.logger.debug(this.id+'.uncheckCheckbox(divCheckbox:'+divCheckbox+')');

    divCheckbox.isChecked=false;

    var svgCheckmark=divCheckbox.svgCheckmark;
    if(svgCheckmark)svgCheckmark.hide();
  }

  ,mouseDownFile:function(
    div
    ,e
  ){
    Ispaces.logger.debug(this.id+'.mouseDownFile(div:'+div+', e:'+e+')');

    var _this=this;

    //var button=e.button;
    var button=e['button']; // which button was clicked 0 = left click, 2 = right click

    //*
    //Ispaces.logger.object(e);
    Ispaces.logger.debug('button = '+button);
    Ispaces.logger.debug('e.shiftKey = '+e.shiftKey);
    Ispaces.logger.debug('e.ctrlKey = '+e.ctrlKey);
    Ispaces.logger.debug('e.altKey = '+e.altKey);
    //Ispaces.logger.debug('e.button = '+e.button);
    //Ispaces.logger.debug("e['button'] = "+e['button']);
    //*/

    var selectedDivs=this.selectedDivs;
    if(!selectedDivs)selectedDivs=this.selectedDivs=[];

    //Ispaces.logger.debug('selectedDivs.length = '+selectedDivs.length);

    if(!e.ctrlKey){ // If this is NOT a CTRL-Click operation, we deslect the selected files.

      var i
      ,z=selectedDivs.length
      ,selectedDiv
      ;

      for(i=0;i<z;i++){

        selectedDiv=selectedDivs[i];

        if(selectedDiv!=this){ // Do not touch the div handling the mouse down.

          //selectedDivs[i].checkbox.click();
          //Ispaces.logger.debug(this.classId+': div.mouseDown(): selectedDiv = '+selectedDiv);
          //div.rCN('desktopdrag','desktop');

          //selectedDiv.dCN('desktoptop'); // remove the top styling
          //selectedDiv.rCN('desktopdrag','desktop'); // replace that drag style
          //selectedDiv.checkbox.checked=false; // Uncheck the checkbox.
          this.unselectTile(selectedDiv);
          //selectedDiv.removeClass("selected"); // remove the top styling
          //selectedDiv.checkbox.checked=false; // Uncheck the checkbox.

          var svgCheckmark=selectedDiv.divCheckbox.svgCheckmark;
          if(svgCheckmark)svgCheckmark.hide();

        }

      }
      selectedDivs.clear(); // If no CRTL key, clear the selected DIVs.
    }

    // Add this div to the selected DIVs and style it.
    //selectedDivs.push(this);
    //this.selectedDiv=this; // Set a reference on the FOlder object.
    //this.rCN('desktop','desktopdrag');
    //this.addAll('desktoptop');
    this.selectTile(div);
    //div.addClass("selected");

    var svgCheckmark=div.divCheckbox.svgCheckmark;
    if(!svgCheckmark){
      svgCheckmark=div.divCheckbox.svgCheckmark=Ispaces.Svg.createCheckmark();
      div.divCheckbox.add(svgCheckmark);
    }else{
      svgCheckmark.show();
    }


    //if(button==0){ // Check for a left click before creating a mousemove handler.
    if(
      (button!=null&&button===0)
      ||Constants.isTouchDevice
    ){ // Check for a left click before creating a mousemove handler.

      if(!div.mouseMoveFunction){

        /*
        var x=e.pageX
        ,y=e.pageY
        ;
        */
        //*
        var mouseDownXY=Common.getMouseXY(e)
        ,mouseDownX=mouseDownXY[0]
        ,mouseDownY=mouseDownXY[1]
        ;
        //*/

        Ispaces.logger.debug(this.id+'.mouseDownFile(div:'+div+', e:'+e+'): TBD - div.mouseMoveFunction=this.mouseMoveFunction.bind()');

        //*
        div.mouseMoveFunction=this.mouseMove.bind( // [native code]
          this
          ,div
          ,mouseDownX
          ,mouseDownY
        );
        //Ispaces.logger.debug('div.mouseMoveFunction = '+div.mouseMoveFunction);
        //*/

        //Ispaces.logger.debug(this.id+'.mouseDownFile(div:'+div+', e:'+e+'): TBD - Removed this.z1000()');
        //div.z1000();

        //var divClone
        //,threshold=3  // the distance in pixel that dragging has to cross before a clone is created and a real drag happens.
        //;

        Common.addListener(
          document
          ,Constants.Events.MOUSEMOVE
          ,div.mouseMoveFunction
        );

      } // if(!this.mouseMoveFunction)
    } // if(e.button==0)

    //Common.preventDefaultEvent(e); // Prevent the drag from selecting text.
    Common.killEvent(e); // Prevent the drag from selecting text.
    return false;
  }

  ,mouseMove:function(
    div
    ,mouseDownX
    ,mouseDownY
    ,e
  ){
    Ispaces.logger.debug(this.id+'.mouseMove(div:'+div+', mouseDownX:'+mouseDownX+', mouseDownY:'+mouseDownY+', e:'+e+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    var threshold=this.threshold
    ,movedX=(e.pageX-mouseDownX)
    ,movedY=(e.pageY-mouseDownY)
    ;

    Ispaces.logger.debug('movedX = '+movedX+', movedY = '+movedY);

    if(
      movedX>=threshold
      ||movedX<=-threshold
      ||movedY>=threshold
      ||movedY<=-threshold
    ){

      if(!div.dragging){
        //Ispaces.logger.debug('div.dragging = '+div.dragging);
        div.dragging=true;

        //var draggable=Ispaces.ui.startDragging(
        //var draggable=Ispaces.spaces.space.startDragging(
        var draggable=Ispaces.spaces.getSpace().startDragging(
          div
          ,mouseDownX
          ,mouseDownY
        );

        //Ispaces.logger.debug('div.filePath = '+div.filePath);
        var filePath=div.filePath;

        draggable.application=this; // Set the panel as a property of the div. @see okCopy()
        draggable.cellPanel=this.cellPanel; // Set the cellPanel as a property of the div. @see okCopy()
        draggable.mouseDownElement=div; // Set a reference to the source element where the mouse down occurred. @see mouseUp() & drop()
        draggable.filePath=filePath; // Set a reference... @see Space.recycle()
        draggable.isDesktop=false; // Set isDesktop=falsee so that dragging a folder tile onto the desktop produces a modal when dropped.

      } // if(!div.dragging)

      Common.removeListener(
        document
        ,Constants.Events.MOUSEMOVE
        ,div.mouseMoveFunction
      );
      div.mouseMoveFunction=null

    }
  }


  ,createTreeItem:function(
    isLocal
    ,protocol
    ,path
    ,fileName
    ,file
  ){
    //Ispaces.logger.debug(this.id+'.createTreeItem(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileName:"'+fileName+'", file:'+file+')');

    var _this=this;

    var filePath=this.getFilePath(protocol,path,fileName);
    //Ispaces.logger.debug('filePath = "'+filePath+'"');

    var isDir=(file===0)||!Common.isArray(file);
    //Ispaces.logger.debug('isDir = '+isDir);

    var div=this.Create.createDiv(this.Create.createTextNode(fileName))
    ,listItem=this.Create.createListItem(div)
    ;

    div.isLocal=isLocal;
    div.isDir=isDir;
    div.filePath=filePath; // set a reference to the URL on the DIV @see drop()
    div.fileName=fileName; // set a reference to the fileName on the DIV @see Ui.startDragging()

    listItem.div=div;
    listItem.isLocal=isLocal;
    listItem.protocol=protocol;
    listItem.path=path;
    listItem.fileName=fileName;
    listItem.filePath=filePath;

    div.listItem=listItem; // set a reference to the LI on the DIV @see drop()
    div.fileElement=listItem; // set a reference to the LI on the DIV @see drop()

    var extension
    ,mimeType
    ;

    var TYPE=Constants.Attributes.TYPE;

    if(isDir){

      listItem.isDir=true; // Set the isDir flag on the listItem.

      /*
      extension='folder';
      //div.setAttribute('type','folder'); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      div.setAttribute(TYPE,"folder"); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      listItem.setClass("folder"); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      */
      mimeType=Ispaces.mimeTypes.getMimeType("folder");

      //listItem.setClass("folder"); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      div.setAttribute('type','folder'); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      //div.setAttribute('type',"folder"); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      //div.setAttribute('type','f0'); // This is used to set the unicode file icon. @see MimeTypes.getChar()

    }else{

      div.setAttribute('type','file'); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      //div.setAttribute(TYPE,"file"); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      //listItem.setClass("file"); // This is used to set the unicode file icon. @see MimeTypes.getChar()


      extension=Ispaces.Launcher.getExtension(fileName);
      //Ispaces.logger.debug('extension = "'+extension+'"');

      //mimeType=Ispaces.MimeTypes.mimeTypes[extension];
      mimeType=Ispaces.mimeTypes.getMimeType(extension);
      //Ispaces.logger.debug('mimeType = '+mimeType);
      //if(!mimeType)mimeType=Ispaces.MimeTypes.mimeTypes['default'];
      //Ispaces.logger.debug('mimeType.id = '+mimeType.id);
      //if(!mimeType)extension='default'; // If there is no mimetype, set to default, so the file gets an icon.
      //if(!mimeType)mimeType=Ispaces.mimeTypes.getMimeType(Constants.Characters.EMPTY); // use empty instead

      /*
      Ispaces.logger.debug('mimeType = '+mimeType);
      Ispaces.logger.debug('mimeType.id = '+mimeType.id);
      Ispaces.logger.debug('mimeType.extension = '+mimeType.extension);
      //*/

      //*
      //div.setAttribute('ext',extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      if(mimeType.extension){
        //cellIcon.addClass(mimeType.extension);
        div.setAttribute('ext',mimeType.extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      }else{
        //cellIcon.addClass(extension); // ext not obfuscated
        if(extension)div.setAttribute('ext',extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()
      }
      //*/

      /*
      listItem.addListener(
        Constants.Events.DBLCLICK
        ,function(e){
          Ispaces.Launcher.launchFileName(this,e);
          //Common.preventDefaultEvent(e);
        }
      );
      */
      Common.addDoubleClick(listItem,function(e){Ispaces.Launcher.launchFileName(this,e);});

    }
    //Ispaces.logger.debug('extension = '+extension);


    /*
     * mouseDownListItemBefore() selects the file/folder
     * mouseDownListItem toggles open the tree and kills the event to prevent it from closing the tree. this is because of the structure of the tree where child listing are sub elements of paretn folders.
     */
    //*
    listItem.addListener(
      this.Events.MOUSEDOWN
      ,this.mouseDownListItemBefore.bind(this,listItem)
      ,true // Set the event capturing phase to 'capturing'.
    );

    listItem.addListener(
      this.Events.MOUSEDOWN
      ,this.mouseDownListItem.bind(this,listItem)
    );
    //*/

    listItem.addListener(
      this.Events.CLICK
      ,this.clickListItem.bind(this,listItem)
    );

    //listItem.addListener(Constants.Events.CONTEXTMENU,this.showFileContextMenu.bind(this));
    listItem.addListener(Constants.Events.CONTEXTMENU,_this.showContextMenu.bind(_this,"DesktopFile"));

    div.addListener(
      this.Events.MOUSEDOWN
      ,function(e){
        Ispaces.logger.debug(_this.id+': div.mouseDown(e:'+e+')');

        //Ispaces.logger.debug('filePath = '+filePath);

        var button=e['button']; // get the button number that was clicked. 0 = left click, 2 = right click
        var which=e['which']; // get which button was clicked. 1 = left click, 3 = right click

        //*
        //Ispaces.logger.object(e);
        Ispaces.logger.debug('button = '+button);
        Ispaces.logger.debug('which = '+which);
        Ispaces.logger.debug('e.shiftKey = '+e.shiftKey);
        Ispaces.logger.debug('e.ctrlKey = '+e.ctrlKey);
        Ispaces.logger.debug('e.altKey = '+e.altKey);
        //Ispaces.logger.debug('e.button = '+e.button);
        //Ispaces.logger.debug("e['button'] = "+e['button']);
        //*/

        /*
         * Activate the drag on left click only. button == 0, which == 1
         * Right-click on Mac: button == 2
         */
        if(
          (button!=null&&button===0)  // Left click only (Firefox)
          ||(which!=null&&which===1)  // Left click only (Mac, IE). Mac uses CTRL-Click to activate the context menu, so we need to check for that here before creating a mouse.
          ||Constants.isTouchDevice
          &&!this.mouseMoveFunction // Sometimes the dragging gets stuck on.
        ){

          //Ispaces.global.draggableObject=_this; // Global catch-all object.
          //Ispaces.global.mouseUpObject=_this; // Global catch-all object.

          //*
          var mouseDownXY=Common.getMouseXY(e)
          ,mouseDownX=mouseDownXY[0]
          ,mouseDownY=mouseDownXY[1]
          ;
          //*/
          //var mouseDownX=e.pageX,mouseDownY=e.pageY;

          var divXY=Common.getXY(div)
          ,divX=divXY[0]
          ,divY=divXY[1]
          ;

          //var scrollTop=_this.divFiles.scrollTop;
          var scrollTop=_this.cellFiles.scrollTop;
          Ispaces.logger.debug('scrollTop = '+scrollTop);
          Ispaces.logger.warn('scrollTop = '+scrollTop);

          //Ispaces.logger.debug("mouseDownXY = "+mouseDownXY);
          //Ispaces.logger.debug("divXY = "+divXY);
          //Ispaces.logger.debug('scrollTop = '+scrollTop);

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
            ,_this.Events.MOUSEMOVE

            //,_this.mouseMoveFunction=function(e1){ // _this == FileManager
            //,this.mouseMoveFunction=function(e1){ // this == document
            //,_div.mouseMoveFunction=function(e1){ // _div == div
            ,div.mouseMoveFunction=function(e1){ // _div == div
              //Ispaces.logger.debug(_this.id+': div.mouseDown(e:'+e+'): _div.mouseMoveFunction(e1:'+e1+')');

              //*
              var mouseXY=Common.getMouseXY(e1)
              ,mouseX=mouseXY[0]
              ,mouseY=mouseXY[1]
              ;
              //*/
              //var mouseX=e1.pageX,mouseY=e1.pageY;

              //mouseMovedX=(mouseXY[0]-mouseDownXY[0]),mouseMovedY=(mouseXY[1]-mouseDownXY[1]);
              //mouseMovedX=(mouseXY[0]-mouseDownX),mouseMovedY=(mouseXY[1]-mouseDownY);
              mouseMovedX=(mouseX-mouseDownX),mouseMovedY=(mouseY-mouseDownY);

              //Ispaces.logger.debug("mouseXY = "+mouseXY);
              //Ispaces.logger.debug('mouseMovedX = '+mouseMovedX+', mouseMovedY = '+mouseMovedY);

              //Ispaces.logger.debug('mouseMovedX>threshold = '+(mouseMovedX>threshold));
              //Ispaces.logger.debug('mouseMovedX<-threshold = '+(mouseMovedX<-threshold));
              //Ispaces.logger.debug('mouseMovedY>=threshold = '+(mouseMovedY>=threshold));
              //Ispaces.logger.debug('mouseMovedY<=-threshold = '+(mouseMovedY<=-threshold));

              /*
               * If the threshold has been passed, start up the dragger by calling Ispaces.ui.startDragging() and remove this mousemove handler.
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

                  //div.cellPanel=_this.cellPanel; // Set the cellPanel as a property of the div. @see okCopy()

                  /*
                   * Set the global mouseup handler to this file manager object. @see Common.mouseUp(), Space.mouseUp()
                   */
                  //Ispaces.global.mouseUpObject=_this; // Global catch-all object.
                  Common.setMouseUpObject(_this); // Global catch-all object.

                  //Ispaces.ui.startDragging(
                  //var draggable=Ispaces.ui.startDragging(
                  var draggable=Ispaces.spaces.getSpace().startDragging(
                    div
                    ,mouseDownX
                    ,mouseDownY
                  );

                  draggable.cellPanel=_this.cellPanel; // Set the cellPanel as a property of the div. @see okCopy()
                  draggable.application=_this; // Set the cellPanel as a property of the div. @see okCopy()
                  draggable.mouseDownElement=div; // Set a reference to the source element where the mouse down occurred. @see mouseUp() & drop()
                  draggable.filePath=filePath; // Set a reference... @see Space.recycle()
                  //draggable.isDir=isDir; // is this a directory/folder?
                  //draggable.isDir=div.isDir; // is this a directory/folder?
                  //draggable.isLocal=isLocal; // is this a directory/folder?
                  draggable.isDesktop=false; // Set isDesktop=falsee so that dragging a folder item onto the desktop produces a modal when dropped.

                  //Ispaces.logger.debug("draggable.filePath = "+draggable.filePath);

                  /*
                  div.divClone=divClone;
                  divClone.srcElement=div; // set a reference to the source element where the mouse down occurred @see mouseUp() & drop()
                  div.application=_this; // set a reference to the current app in case we are copying from one app to another.
                  div.cellPanel=_this.cellPanel;
                  divClone.filePath=filePath; // Set a reference. @see Space.recycle()
                  divClone.setPosition(Constants.Properties.ABSOLUTE);
                  divClone.toFrontModals();
                  //divClone.setBorder(Constants.Borders.RED);
                  //divClone.setClass(className);
                  //divClone.setClass(className+' dragging');
                  //divClone.setClass('dragging'); // Set the className to dragging so the cloned element can have a hover look.
                  //Ispaces.logger.debug('div.mouseDown(): divClone.setAttribute(\'ext\', '+className+')');
                  //divClone.setAttribute('ext',className);
                  //Ispaces.logger.debug('div.mouseDown(): divClone.setAttribute("ext", "'+extension+'")');
                  //divClone.setAttribute('ext',extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()

                  //divClone.setLeftPixels(divXY[0]),divClone.setTopPixels(divXY[1]);
                  //divClone.setLeftPixels(divX),divClone.setTopPixels(divY);
                  //divClone.setXY(divX,divY);

                  // Set the global drag element and the mouseUp catcher.
                  //_this.draggable=divClone;
                  //Ispaces.draggable=divClone;
                  Ispaces.global.draggable=divClone; // Set the global drag element. @see Ispaces.global.mouseUpCapturing()
                  Ispaces.global.mouseUpCapturing=Ispaces.spaces.space; // For dropping the on the desktop.
                  */

                } // if(!div.dragging)

                /*
                 * Now that the threshold has been reached and the div cloned, remove the mousemove listener and replace it with the most efficient handler without any if/else statements.
                 */
                Common.removeListener(
                  document
                  ,_this.Events.MOUSEMOVE
                  ,div.mouseMoveFunction
                );
                div.mouseMoveFunction=null;

                /*
                //_this.draggable=divClone;
                //Ispaces.draggable=divClone;
                //Ispaces.dropObject=_this;
                //Ispaces.dropObject=Ispaces.spaces.space; // Catch-all mouseUp() handler in Space.js
                //Ispaces.dropObject=Ispaces.spaces.getSpace().desktop; // Catch-all mouseUp() handler in Desktop.js
                //Ispaces.global.mouseUpCapturing=Ispaces.spaces.space; // For dropping the on the desktop.
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

    ); // div.addListener(this.Events.MOUSEDOWN...

    /*
    if(Constants.isTouchDevice){ // touch

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

    } // if(Constants.isTouchDevice)
    //*/

    div.mouseUp=function(e){
      Ispaces.logger.debug(_this.id+': div.mouseUp(e:'+e+')');

      //Ispaces.logger.debug("this.mouseMoveFunction = "+this.mouseMoveFunction);
      //Ispaces.logger.debug("_this.mouseMoveFunction = "+_this.mouseMoveFunction);

      this.dragging=false;

      if(this.dragging){
        this.dragging=false;
      }

      //Ispaces.global.mouseUpObject=null; // Global catch-all object.

      if(this.mouseMoveFunction){
        Common.removeListener(
          document
          ,_this.Events.MOUSEMOVE
          ,this.mouseMoveFunction
        );
        this.mouseMoveFunction=null;
      }

      if(_this.mouseMoveFunction){
        Common.removeListener(
          document
          ,_this.Events.MOUSEMOVE
          ,_this.mouseMoveFunction
        );
        _this.mouseMoveFunction=null;
      }

      //Ispaces.logger.debug("this.mouseMoveFunction = "+this.mouseMoveFunction);
      //Ispaces.logger.debug("_this.mouseMoveFunction = "+_this.mouseMoveFunction);

      //if(this.divClone)this.divClone.rm();
      if(this.divClone)this.divClone.hide();
    };

    div.addListener(
      this.Events.MOUSEUP // can be mouseup or touchend
      ,div.mouseUp
    );

    //div.dc(function(e){Ispaces.Launcher.launchFileName(this,e)}); // TO launch a folder. This does not seem to work as mouse down opens a folder.

    /*
    div.draggable=true;
    div.setAttribute('draggable','true');

    div.addListener('dragstart',function(e){
      Ispaces.logger.debug('handleDragStart');
      //this.style.opacity = '0.4';  // this / e.target is the source node.
      //dragSrcEl=this;
      //e.dataTransfer.effectAllowed = 'move';
      //e.dataTransfer.setData('text/html', this.innerHTML);
    },false);

    div.addListener('dragenter',function(){
      Ispaces.logger.debug('handleDragEnter')
    },false);

    div.addListener('dragover',function(e){
      Ispaces.logger.debug('handleDragOver');
      //if (e.preventDefault)e.preventDefault(); // Necessary. Allows us to drop.
      //e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
      return false;
    },false);

    div.addListener('dragleave',function(e){
      Ispaces.logger.debug('handleDragLeave');
    },false);

    div.addListener('drop',function(e){
      Ispaces.logger.debug('handleDrop');
    },false);

    div.addListener('dragend',function(e){
      Ispaces.logger.debug('handleDragEnd');
    },false);

    div.addListener('drop',function(e){
      Ispaces.logger.debug('handleDragEnd');
    },false);
    */

    //listItem.md(function(e){_this.clickListItem(e,listItem);Common.stopEventPropagation(e)});
    //listItem.md(function(e){Common.stopEventPropagation(e)});
    //listItem.md(function(e){ // TBD - this mousedown should drag the file.
    //  Ispaces.logger.debug('listItem.md('+e+')');

      /*
      Common.stopEventPropagation(e);
      //Common.preventDefaultEvent(e);
      //Common.killEvent(e);
      return false;
      //*/
    //});

    return listItem;
  } // createTreeItem()

  //,holdAsyncApply:{}


  /*
   * Refresh
   */

  ,refreshPath:function(filePath){
    Ispaces.logger.debug(this.classId+'.refreshPath(filePath:"'+filePath+'")');

    var split=filePath.split(this.Constants.FORWARDSLASH);
    //Ispaces.logger.debug('split = '+split);

    var slice=split.slice(1,(split.length-1));
    //Ispaces.logger.debug('slice = '+slice);

    var sliceLength=slice.length;
    //Ispaces.logger.debug('sliceLength = '+sliceLength);

    var cellPanel=this.cellPanel
    ,protocol=cellPanel.protocol
    ,isLocal=cellPanel.isLocal
    ,unorderedList=cellPanel.unorderedList
    ;

    //Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('protocol = '+protocol);
    //Ispaces.logger.debug('isLocal = '+isLocal);
    //Ispaces.logger.debug('unorderedList = '+unorderedList);

    /*
    this.tree({
      cellPanel:cellPanel
      ,protocol:protocol
      ,isLocal:isLocal
      ,filePath:filePath
    });
    */

    var childNodes=unorderedList.childNodes;
    //Ispaces.logger.debug('childNodes = '+childNodes);
    //Ispaces.logger.debug('childNodes.length = '+childNodes.length);
    //Ispaces.logger.debug('unorderedList.listItems = '+unorderedList.listItems);

    var listItem
      //,listItems=unorderedList.listItems
      //,listItems=childNodes
      ,z=childNodes.length
      ,i
      ,dir
    ;
    //Ispaces.logger.debug('listItems.length = '+listItems.length);

    var cellPanel=this.cellPanel;

    for(i=0;i<z;i++){
      //listItem=listItems[i];
      //listItem=childNodes.getItem[i];
      listItem=childNodes[i];

      //Ispaces.logger.debug('listItem.isLocal = '+listItem.isLocal);
      //Ispaces.logger.debug('listItem.protocol = "'+listItem.protocol+'"');
      //Ispaces.logger.debug('listItem.fileName = '+listItem.fileName+'"');
      //Ispaces.logger.debug('listItem.path = '+listItem.path);
      //Ispaces.logger.debug('listItem.fileName = '+listItem.fileName+'"');

      var fileName=listItem.fileName;

      for(var j=0;j<slice.length;j++){

        dir=slice[j];

        //Ispaces.logger.debug('fileName = '+fileName+'", dir = '+dir+'"');

        if(fileName==dir){

          Ispaces.logger.debug('(fileName==dir)');

          if(i==sliceLength){
            listItem.refresh=true;
            listItem.isOpen=false;
            this.toggleOpenFolder(listItem);
          }
        }
      }
    }
  }

  ,refresh:function(refresh){
    Ispaces.logger.debug(this.classId+'.refresh(refresh:'+refresh+')');

    var cellPanel=this.cellPanel
    //,listItem=cellPanel.listItem
    ,fileElement=cellPanel.fileElement
    ;

    Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('listItem = '+listItem);
    Ispaces.logger.debug('fileElement = '+fileElement);

    //if(listItem){
    if(fileElement){
      //this.refreshListItem(listItem,cellPanel);
      this.refreshListItem(fileElement,cellPanel);
      return
    }

    var protocol=cellPanel.protocol;
    var isLocal=cellPanel.isLocal;

    //Ispaces.logger.debug('protocol = '+protocol);
    //Ispaces.logger.debug('isLocal = '+isLocal);

    //this.tree(protocol,isLocal);
    //this.tree(protocol);
    //this.tree(cellPanel);
    this.tree({
      cellPanel:cellPanel
      ,protocol:protocol
      //,isLocal:isLocal
      ,refresh:refresh
    });

  }

  //,refreshPanel:function(panelIndex){
    //Ispaces.logger.debug(this.classId+'.refreshPanel(panelIndex:'+panelIndex+')');
  ,refreshPanel:function(cellPanel){
    Ispaces.logger.debug(this.classId+'.refreshPanel(cellPanel:'+cellPanel+')');

    this.tree({
      cellPanel:cellPanel
      ,protocol:cellPanel.protocol
      //,divFiles:cellPanel.divFiles
      ,cellFiles:cellPanel.cellFiles
      //,isLocal:cellPanel.isLocal
      ,refresh:true
    });

  }

  /*
   * If listItem is a file, we need to update the parent.
   */
  ,refreshListItem:function(listItem,cellPanel){
    Ispaces.logger.debug(this.classId+'.refreshListItem(listItem:'+listItem+', cellPanel:'+cellPanel+')');
    //Ispaces.logger.alert(this.classId+'.refreshListItem(listItem:'+listItem+', cellPanel:'+cellPanel+')');

    if(listItem){

      //Ispaces.logger.debug('listItem.filePath = '+listItem.filePath);

      // If the 'listItem' is a file, update the parent.
      var isDir=listItem.isDir;
      //Ispaces.logger.debug('isDir = '+isDir);

      if(!isDir){
        var unorderedListParent=listItem.parentNode;
        //Ispaces.logger.debug('unorderedListParent = '+unorderedListParent);
        var listItemParent=unorderedListParent.listItem;
        //Ispaces.logger.debug('listItemParent = '+listItemParent);
        if(listItemParent){
          listItem=listItemParent;
        }else{
          //this.refreshPanel(listItem.cellPanel);
          this.refreshPanel(cellPanel||this.cellPanel);
          return;
        }
      }

      listItem.refresh=true;
      listItem.isOpen=false;
      //listItem.unorderedList=null; // Set the unorderedList to null, so that it can be recreated.
      this.toggleOpenFolder(listItem);
    }else{
      this.refresh(true);
      return;
    }

    /*
    var filePath=listItem.filePath
      ,path=listItem.path
      ,fileName=listItem.fileName
    ;

    Ispaces.logger.debug('filePath = '+filePath);
    Ispaces.logger.debug('path = '+path);
    Ispaces.logger.debug('fileName = '+fileName);

    var cellPanel=this.cellPanel
      ,protocol=cellPanel.protocol
      ,isLocal=cellPanel.isLocal
      ,unorderedList=cellPanel.unorderedList
    ;

    Ispaces.logger.debug('cellPanel = '+cellPanel);
    Ispaces.logger.debug('protocol = '+protocol);
    Ispaces.logger.debug('isLocal = '+isLocal);
    Ispaces.logger.debug('unorderedList = '+unorderedList);
    */

    /*
    listItem.refresh=true;
    listItem.isOpen=false;
    this.toggleOpenFolder(listItem);
    */

    /*
    this.tree({
      cellPanel:cellPanel
      ,protocol:protocol
      ,isLocal:isLocal
      ,filePath:filePath
    });
    */

  }


  /*
   * Mouse/Touch Events
   */

  ,mouseDownRoot:function(_listItem,e){
    Ispaces.logger.debug(this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+')');
    //Ispaces.logger.alert(this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+')');

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
      //Common.stopEventPropagation(e);
      //Common.preventDefaultEvent(e);
      //Common.killEvent(e); // prevent the click from activating a cellPanel drag
      //e.returnValue=false;
      //e.stopPropagation(); // prevent the click from activating a cellPanel drag
      e.cancelBubble=true; // prevent the click from activating a cellPanel drag
      e.preventDefault(); // prevent the mousedown from creating a text selection
    }

    Ispaces.logger.debug('_listItem.isOpen = '+_listItem.isOpen);
    Ispaces.logger.debug('_listItem.parentNode = '+_listItem.parentNode);
    Ispaces.logger.debug('_listItem.rootUnorderedList = '+_listItem.rootUnorderedList);

    var _this=this
    ,root=_listItem.root
    ,isLocal=_listItem.isLocal
    ,isOpen=_listItem.isOpen
    ,protocol=_listItem.protocol
    ,topbar=_listItem.topbarDiv.topbar
    ,rootUnorderedList=_listItem.parentNode
    //,rootUnorderedList=_listItem.rootUnorderedList
    ;

    //  cellPanel.rootUnorderedList=rootUnorderedList; // Set a reference to the rootUnorderedList on the cellPanel. @see divTable.ocButton().
    //  cellPanel.cellRoots=cellRoots; // for root recreation
    //Ispaces.logger.debug(this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+'): _listItem.parentNode = '+_listItem.parentNode);
    //Ispaces.logger.debug(this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+'): _listItem.parentNode = '+_listItem.parentNode.cellRoots);

    Ispaces.logger.debug('root = '+root);
    Ispaces.logger.debug('isOpen = '+isOpen);
    Ispaces.logger.debug('isLocal = '+isLocal);
    Ispaces.logger.debug('protocol = '+protocol);
    Ispaces.logger.debug('topbar = '+topbar);
    Ispaces.logger.debug('rootUnorderedList = '+rootUnorderedList);
    if(rootUnorderedList)Ispaces.logger.debug('rootUnorderedList.isOpen = '+rootUnorderedList.isOpen);
    if(!isOpen)isOpen=rootUnorderedList.isOpen;

    _this.root=root;

    /*
     * If the list is closed, open it and return.
     * If the list is open, close it and select the list item.
     */
    //if(rootUnorderedList.isOpen){
    if(isOpen){

      rootUnorderedList.listItem=_listItem; // Set a reference to the selected listItem on the rootUnorderedList.

      Ispaces.logger.debug('rootUnorderedList.listItem = '+rootUnorderedList.listItem);

      /*
      var topbarDiv=listItem.topbarDiv;
      if(topbarDiv){
        topbarDiv.setPosition(Constants.Properties.RELATIVE);
        //topbarDiv.di(Constants.Properties.TABLECELL);
        //topbarDiv.positionRelative(0,0);
        topbarDiv.setWidthPercent(100);
      }
      */

      Ispaces.logger.debug('rootUnorderedList.setClass('+_this.Constants.EMPTY+')');
      rootUnorderedList.setClass(_this.Constants.EMPTY);

      //topbar.setClass('topbar');
      rootUnorderedList.isOpen=false;
      _listItem.isOpen=false;

      _this.cellPanel.setOverflow(Constants.Properties.HIDDEN); // This functionality is to here so that the root select box is able to get a shadow.

    }else{

      /*
      var topbarDiv=listItem.topbarDiv;
      if(topbarDiv){
        var w=Common.getWidth(topbarDiv);
        //Ispaces.logger.debug(_this.id+'.mouseDownRoot('+listItem+'): w = '+w);
        topbarDiv.setWidthPixels(w);
        topbarDiv.setPosition(Constants.Properties.ABSOLUTE);
      }
      */

      //*
      var cellRoots=rootUnorderedList.cellRoots; // To measure the rootCell.
      //var widthHeight=Common.getWidthHeight(cellRoots);
      //cellRoots.setWidthHeightPixels(widthHeight[0],widthHeight[1]);
      var w=Common.getWidth(cellRoots);
      cellRoots.setWidthPixels(w);
      //*/

      //rootUnorderedList.setClass('selectOpen');
      rootUnorderedList.setClass("open");
      //topbar.setClass('topbaropen');
      rootUnorderedList.isOpen=true;
      _listItem.isOpen=true;
      rootUnorderedList.toFrontModals(); // Ensure that the drop-down is on top.

  //,selectRoot:function(cellPanel,protocol){

      /*
      //if(protocol=='select')_listItem.remove(); // This removes the initial "Select" option from the dropdown.
      if(protocol=='select'){
        //Ispaces.logger.debug(_this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+'): (protocol==\'select\')');
        _listItem.remove(); // This removes the initial "Select" option from the dropdown.
      }
      */

      /*
       * This functionality is to here so that the root select box is able to get a shadow.
       */
      /*
      var cellPanel=_this.cellPanel;
      var panelWidthHeight=Common.getWidthHeight(cellPanel);
      cellPanel.setWidthPixels(panelWidthHeight[0]);
      cellPanel.setMinWidth(panelWidthHeight[0]);
      cellPanel.setOverflow(Constants.Properties.VISIBLE); //
      cellPanel.panel.toFront();
      */
      _this.cellPanel.setOverflow(Constants.Properties.VISIBLE); // This functionality is to here so that the root select box is able to get a shadow.

      //Ispaces.logger.debug(_this.id+'.mouseDownRoot('+li+'): LEAVING');
      //return;
      return false;
    }

    var listItem
    ,listItems=rootUnorderedList.listItems
    ,listItemsLength=listItems.length
    ,listItemSelected=rootUnorderedList.listItemSelected
    ,divText=listItemSelected.divText
    ,i
    ;

    Ispaces.logger.debug('listItems.length = '+listItems.length);

    for(i=0;i<listItemsLength;i++){

      listItem=listItems[i];

      /*
      Ispaces.logger.alert(_this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+'): listItem.protocol = '+listItem.protocol);
      if(listItem.protocol=='select'){
        Ispaces.logger.alert(_this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+'): (protocol==\'select\')');
        listItem.remove(); // This removes the initial "Select" option from the dropdown.
        listItems.remove(listItem);
      }
      */

      Ispaces.logger.info('Now hiding all list items.');
      listItem.setClass(_this.Constants.EMPTY); // Now hiding all list items

      if(listItem!=_listItem){ // Not the selected item... hide it.

        //listItem.setClass(_this.Constants.EMPTY);

      }else{ // The selected item.

        //Ispaces.logger.alert(_this.id+'.mouseDownRoot(_listItem:'+_listItem+', e:'+e+'): listItem.childNodes[0].nodeValue = '+listItem.childNodes[0].nodeValue);
        //listItem.setClass('selected');

        /*
         * Update the first list item with the selected root.
         */
        //divText.replaceFirst(_this.Create.createTextNode(listItem.name));

        var sb=new Ispaces.StringBuilder(listItem.name);
        var totalUsage=root.totalUsage;
        Ispaces.logger.debug('totalUsage = '+totalUsage);
        if(totalUsage){
          var size=Ispaces.StringFormat.bytesToSize(parseInt(totalUsage),1);
          Ispaces.logger.debug('size = '+size);
          sb.appendAll([' (',size,')']);
        }
        //listItem.add(Create.createTextNode(txt));
        divText.replaceFirst(_this.Create.createTextNode(sb.asString()));

        rootUnorderedList.listItem=listItem;

        /*
        if(_this.treeShowing){
          //_this.tree(_this.cell,_this.root,FORWARDSLASH);
          _this.tree();
        }else{
          //_this.flat(_this.cell,_this.root,FORWARDSLASH);
          //_this.flat(_this.cell,_this.root,_this.Constants.EMPTY);
          //_this.flat(_this.cell,_this.root);
          _this.flat();
        }
        */

        //_this.cellPanel.protocol=protocol;

        //_this.tree(listItem.root);
        //_this.tree(protocol,isLocal);
        //_this.tree(_this.cellPanel);

        var cellPanel=_this.cellPanel;
        cellPanel.protocol=protocol;
        cellPanel.isLocal=isLocal;  // Set a reference to isLocal in the cellPanel for quick access. @see okCopy()
        cellPanel.listItem=null;    // Remove any reference to a previously selected ilist item from a previously selected root.

        delete cellPanel.listItem;

        //_this.tree({
        //_this.flat({
        _this[_this.DEFAULT_VIEW]({  // Call the default view upon selecting a new root.
          cellPanel:cellPanel
          ,protocol:cellPanel.protocol
          ,cellFiles:cellPanel.cellFiles
          //,divFiles:cellPanel.divFiles
          //,isLocal:cellPanel.isLocal
          //,isLocal:isLocal
          //,refresh:true
        });

        Common.asyncCall(_this,"save",1000);
      }
    }

    //Ispaces.logger.debug(_this.id+'.mouseDownRoot('+listItem+'): LEAVING');
    return false;
  }

  ,touchStart:function(div,e){
    Ispaces.logger.debug('touchStart(div:'+div+', e:'+e+')');
    Ispaces.logger.debug('arguments.length = '+arguments.length);
    for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    e.stopPropagation();
    e.preventDefault();

    Ispaces.logger.debug('e.screenX = '+e.screenX);
    Ispaces.logger.debug('e.screenY = '+e.screenY);
    Ispaces.logger.debug('e.target = '+e.target);
    Ispaces.logger.debug('e.changedTouches = '+e.changedTouches);
    Ispaces.logger.debug('e.currentTarget = '+e.currentTarget);
    //var changedTouches=e.changedTouches;
    //var firstChangedTouch=changedTouches[0];
    //Ispaces.logger.debug('first = '+first);

    //this.clickListItem(e,e.currentTarget);

    /*
    //e.o=e.currentTarget;
    //e.el=e.currentTarget; // We have to set the target as a property of the event here as passing the event along to the click function looses the currentTarget (= null).
    if(currentTarget){
      e.el=currentTarget; // We have to set the target as a property of the event here as passing the event along to the click function looses the currentTarget (= null).
    }
    */
    e.targetElement=div; // We have to set the target as a property of the event here as passing the event along to the click function looses the currentTarget (= null).

    var touch=e.touches[0];
    Ispaces.logger.debug('touch = '+touch);

    //e.o=body;
    //e.target=body;

    //this.holdTimeout=window.setTimeout(this.emulateRightClick,600);
    //this.holdAsyncApply=new Ispaces.AsyncApply(this,"emulateRightClick",null,600);
    //holdAsyncApply=new Ispaces.AsyncApply(this,"emulateRightClick",[e],600);

    //var _this=this;
    //Ispaces.logger.debug('touchStart('+e+'): _this = '+_this);
    //Ispaces.logger.alert('touchStart('+e+'): _this = '+_this);
    //holdAsyncApply=new Ispaces.AsyncApply(_this,"emulateRightClick",[e],600);
    this.holdAsyncApply=new Ispaces.AsyncApply(
    //this.holdAsyncApply=new Ispaces.AsyncApply(

      //_this
      //null
      this

      /*
      ,function(e){
        Ispaces.logger.debug('holdAsyncApply(e:'+e+')');
        //var contextMenu=;
        //contextMenu.show(e);
        Ispaces.spaces.getSpace().desktop.showContextMenu(e);
        Common.stopEventPropagation(e);
        return false;
      }
      _this.showContextMenu(e);
      Common.stopEventPropagation(e);
      return false;
    });
      */
      //,this.showContextMenu.bind(this,e)
      ,"showFileContextMenu"
      ,[e]
      ,600
    );

    return false;
  }

  ,touchEnd:function(e){
    Ispaces.logger.debug('touchEnd('+e+')');

    Ispaces.logger.debug('touchEnd('+e+'): this.holdAsyncApply = '+this.holdAsyncApply);
    if(this.holdAsyncApply){
      this.holdAsyncApply.cancel();
      this.holdAsyncApply=null;
    }

    //if(Ispaces.global.escapeObject){
    //  Ispaces.logger.debug('mouseClick(e): Ispaces.global.escapeObject');
    //  Ispaces.global.escapeObject.escape();
    //  Ispaces.global.escapeObject=null;
    //  Ispaces.global.escapeKeyObject=null;
    //}

  }

  /*
   * A mousedown on the divFiles should deselect the selected file, to allow for a top level foder to be created.
   */
  ,mouseDownDivFiles:function(e){
    Ispaces.logger.debug(this.id+'.mouseDownDivFiles(e:'+e+')');

    //if(this.listItem)this.deselectFileElement(this.listItem);
    if(this.fileElement)this.deselectFileElement(this.fileElement);
  }

  ,mouseDownListItemBefore:function(listItem,e){
    Ispaces.logger.debug(this.id+'.mouseDownListItemBefore(listItem.fileName:"'+listItem.fileName+'", e:'+e+')');

    var cellPanelActive=this.cellPanel; // Get the active panel
    //Ispaces.logger.debug('cellPanelActive = '+cellPanelActive);

    var selectedFileElements=cellPanelActive.selectedFileElements; // Get the list of selected items from the active panel.
    if(!selectedFileElements)selectedFileElements=cellPanelActive.selectedFileElements=[];
    //Ispaces.logger.debug('selectedFileElements.length = '+selectedFileElements.length);

    var multipleSelected=(selectedFileElements.length>1); // Are there files already selected?

    if(e&&e.ctrlKey){ // If this is a CTRL-Click operation.

      //this.toggleMultipleSelect(listItem);

      //if(listItem.on){
      if(listItem.isSelected){

        this.deselectFileElement(listItem);
        selectedFileElements.removeNode(listItem);

      }else{

        if(!multipleSelected)selectedFileElements.push(cellPanelActive.listItem); // Add the previous selected li. We are doing a multiple select using the CTRL key.

        selectedFileElements.push(listItem); // Add the list item to the array of selected items in this panel.

        // Select the list item.
        this.selectFileElement(listItem);
        /*
        listItem.on=true;
        //this.listItem=listItem;
        cellPanelActive.listItem=listItem;
        listItem.div.setClass('selected');
        */

        //this.multipleFilesSelected=true;
      }

    }else{

      if(multipleSelected){

        //this.deselectAllFileElements();
        for(var i=0;i<selectedFileElements.length;i++){
          this.deselectFileElement(selectedFileElements[i]);
        }
        selectedFileElements.clear();
        multipleSelected=false;

      }else{

        selectedFileElements.clear();

        //if(cellPanelActive.listItem)this.deselectFileElement(cellPanelActive.listItem);
        if(cellPanelActive.fileElement)this.deselectFileElement(cellPanelActive.fileElement);
        /*
        if(cellPanelActive.listItem){
          //this.deselectFileElement(cellPanelActive.listItem);
          cellPanelActive.listItem.on=false;
          //this.listItem=listItem;
          cellPanelActive.listItem.div.setClass('');
        }
        */
      }

      // Select the list item.
      this.selectFileElement(listItem);
      /*
      listItem.on=true;
      //this.listItem=listItem;
      cellPanelActive.listItem=listItem;
      listItem.div.setClass('selected');
      */

      // Add the list item to the array of selected items.
      //this.listItems.push(listItem);
      selectedFileElements.push(listItem);
      //cellPanelActive.selectedFileElements.push(listItem);
    }

    //Ispaces.logger.debug('cellPanelActive.selectedFileElements.length = '+cellPanelActive.selectedFileElements.length);
  }

  /*
   * Handles the mouse down event on the list item in the file tree.
   */
  ,mouseDownListItem:function(listItem,e){
    Ispaces.logger.debug(this.id+'.mouseDownListItem(listItem:"'+listItem+'", e:'+e+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    Ispaces.logger.debug('listItem.isDir = '+listItem.isDir);
    Ispaces.logger.debug('listItem.fileName = "'+listItem.fileName+'"');

    if(listItem.isDir){

      //listItem.isOpen=false;
      //this.toggleOpenFolder(listItem,e); // Moved to asynchronous call.
      Common.asyncApply(
        this
        ,"toggleOpenFolder"
        ,[listItem,e]
        ,1
      );
    }

    /*
     * Prevent the mousedown from activating a panel drag.
     * Prevent the mousedown from closing the tree.
     */
    Common.killEvent(e); // Panel dragging has been temporarily disabled for beta 2.0
    return false;        // Panel dragging has been temporarily disabled for beta 2.0
  }

  /*
   * Handles the mouse down event on the list item in the file tree.
   */
  /*
  ,mouseDownLiBak:function(
    listItem
    ,e
  ){
    Ispaces.logger.debug(this.id+'.mouseDownListItem(listItem.fileName:"'+listItem.fileName+'", e:'+e+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);
    var panelActive=this.cellPanel; // Get the active panel
    //Ispaces.logger.debug('panelActive = '+panelActive);

    var listItemsSelected=panelActive.listItemsSelected; // Get the list of selected items from the active panel.
    if(!listItemsSelected)listItemsSelected=panelActive.listItemsSelected=[];
    //Ispaces.logger.debug('listItemsSelected.length = '+listItemsSelected.length);

    var multipleSelected=(listItemsSelected.length>1); // Are there files already selected?

    if(e&&e.ctrlKey){ // If this is a CTRL-Click operation.

      //this.toggleMultipleSelect(listItem);

      if(listItem.on){

        this.deselectFileElement(listItem);
        listItemsSelected.remove(listItem);

      }else{

        if(!multipleSelected)listItemsSelected.push(panelActive.listItem); // Add the previous selected li. We are doing a multiple select using the CTRL key.

        listItemsSelected.push(listItem); // Add the list item to the array of selected items in this panel.

        // Select the list item.
        this.selectFileElement(listItem);
        //listItem.on=true;
        ////this.listItem=listItem;
        //panelActive.listItem=listItem;
        //listItem.div.setClass('selected');

        //this.multipleFilesSelected=true;
      }

    }else{

      if(multipleSelected){

        //this.deselectAllFileElements();
        for(var i=0;i<listItemsSelected.length;i++){
          this.deselectFileElement(listItemsSelected[i]);
        }

        listItemsSelected.clear();

        multipleSelected=false;

      }else{

        listItemsSelected.clear();

        if(panelActive.listItem)this.deselectFileElement(panelActive.listItem);
        //if(panelActive.listItem){
        //  //this.deselectFileElement(panelActive.listItem);
        //  panelActive.listItem.on=false;
        //  //this.listItem=listItem;
        //  panelActive.listItem.div.setClass('');
        //}
      }

      // Select the list item.
      this.selectFileElement(listItem);
      //listItem.on=true;
      ////this.listItem=listItem;
      //panelActive.listItem=listItem;
      //listItem.div.setClass('selected');

      // Add the list item to the array of selected items.
      //this.listItems.push(listItem);
      listItemsSelected.push(listItem);
      //panelActive.listItemsSelected.push(listItem);
    }

    //Ispaces.logger.debug('panelActive.listItemsSelected.length = '+panelActive.listItemsSelected.length);


    //Ispaces.logger.debug('listItem.isDir = '+listItem.isDir);
    if(listItem.isDir){
      //listItem.isOpen=false;
      this.toggleOpenFolder(listItem,e);
    }

    // Prevent the mousedown from activating a panel drag.
    // Prevent the mousedown from closing the tree.
    Common.killEvent(e);
    return false;
  }
  */

  /*
  ,mouseUpListItem:function(e,listItem){
    Ispaces.logger.debug(this.id+'.mouseUpListItem(e:'+e+', listItem.fileName:"'+listItem.fileName+'")');

    Ispaces.logger.debug('listItem.isDir = '+listItem.isDir);
    if(listItem.isDir){
      //listItem.isOpen=false;
      //this.toggleOpenFolder(e,listItem);
      this.toggleOpenFolder(listItem,e);
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
  ,clickListItem:function(listItem,e){
    Ispaces.logger.debug(this.id+'.clickListItem(listItem.fileName:"'+listItem.fileName+'", e:'+e+')');

    /*
     * Stop the event from propogating.
     * If we do not have this, the click event closes the parent folder.
     */
    Common.stopEventPropagation(e);

    //Ispaces.logger.debug('listItem.fileName = "'+listItem.fileName+'"');
    //Ispaces.logger.debug('listItem.path = "'+listItem.path+'"');
    //Ispaces.logger.debug('listItem.parent = "'+listItem.parent+'"');
    //Ispaces.logger.debug('listItem.filePath = "'+listItem.filePath+'"');
    //if(this.pathDiv)this.pathDiv.input.value=listItem.path; // Set the selected path.

    /*
    if(e&&e.ctrlKey){
      Ispaces.logger.debug(this.id+'.clickListItem(e, div, listItem): e.ctrlKey = '+e.ctrlKey);

      this.toggleMultipleSelect(listItem);
      //this.toggleMultipleSelect(listItem,div);

    }else{

      //this.listItems.clear();
      //this.listItems.push(listItem);
      if(this.multipleFilesSelected){
        this.deselectAllFileElements();
      }else{
        this.listItems.clear();
        if(this.listItem)this.deselectFileElement(this.listItem);
      }

      this.selectFileElement(listItem);
      this.listItems.push(listItem);

      // A little trick here.
      // Instead of checking if this folder has been opened before, we just set listItem.isOpen=false and call toggleOpenFolder() which takes care of everything.
      Ispaces.logger.debug('listItem.isDir = '+listItem.isDir);
      if(listItem.isDir){
        //listItem.isOpen=false;
        //this.toggleOpenFolder(e,listItem);
        this.toggleOpenFolder(listItem,e);
      }
    }
    */

    // Toggle open if it is a folder.
    /*
    Ispaces.logger.debug(this.id+'.clickListItem(listItem.fileName:"'+listItem.fileName+'", e:'+e+'): listItem.isDir = '+listItem.isDir);
    if(listItem.isDir){
      //listItem.isOpen=false;
      //this.toggleOpenFolder(e,listItem);
      this.toggleOpenFolder(listItem,e);
    }
    */
  }

  ,toggleOpenFolder:function(listItem,e){
    Ispaces.logger.debug(this.id+'.toggleOpenFolder(listItem:'+listItem+', e:'+e+')');
    //Ispaces.logger.alert(this.id+'.toggleOpenFolder(listItem:'+listItem+', e:'+e+')');

    //var _this=this;

    var isLocal=listItem.isLocal
    ,protocol=listItem.protocol
    ,isOpen=listItem.isOpen
    ,unorderedList=listItem.unorderedList
    ,path=listItem.path
    ,origPath=listItem.path
    ,fileName=listItem.fileName
    ,refresh=listItem.refresh
    //,refresh=listItem.refresh||false
    ;

    //var cellPanel=listItem.parentUnorderedList.cellPanel;
    //Ispaces.logger.debug(this.id+'.toggleOpenFolder(listItem:'+listItem+', e:'+e+'): cellPanel = '+cellPanel);

    /*
    Ispaces.logger.debug('isLocal = '+isLocal);
    Ispaces.logger.debug('protocol = '+protocol);
    Ispaces.logger.debug('isOpen = '+isOpen);
    Ispaces.logger.debug('unorderedList = '+unorderedList);
    Ispaces.logger.debug('path = '+path);
    Ispaces.logger.debug('origPath = '+origPath);
    Ispaces.logger.debug('fileName = '+fileName);
    Ispaces.logger.debug('refresh = '+refresh);
    //*/

    if(!isOpen){

      listItem.isOpen=true;

      if(
        unorderedList
        &&!refresh
      ){

        unorderedList.show();

      }else{

        /*
        //var fileMap=Ispaces.Files.get(root,path,fileName);
        var fileMap=Ispaces.Files.get(isLocal,protocol,path,fileName);

        //// We should only need to handle authenticate error (-1) when a user selects the root. @see createTree()
        //Ispaces.logger.debug('fileMap = '+fileMap);
        //Ispaces.logger.debug('(fileMap==-1) = '+(fileMap==-1));
        //if(fileMap==-1){ // fileMap returns -1, we need to authenticate
        //  this.authenticate(protocol);
        //  return;
        //}

        Ispaces.logger.debug('Common.getSize(fileMap) = '+Common.getSize(fileMap));

        // The switch... the fileName becomes part of the next path
        if(path==''){
          path=fileName;
        }else{
          path=path+'/'+fileName;
        }
        Ispaces.logger.debug('NEW PATH = '+path);

        //var unorderedList=this.createTreeUnorderedList(fileMap,root,path);
        var unorderedList=this.createTreeUnorderedList(isLocal,protocol,path,fileMap);
        //unorderedList.borderLeft('transparent 18px solid'); // Indent the sub folders.
        unorderedList.setMarginLeft('18px'); // Indent the sub folders.
        //listItem.setClass('open');
        //listItem.setClass('');
        listItem.setClass(listItem.cn);
        unorderedList.listItem=listItem;
        listItem.unorderedList=unorderedList;
        listItem.add(unorderedList);
        */

        var _this=this;
        var FORWARDSLASH=_this.Constants.FORWARDSLASH;

        var callback=function(
          isLocal
          ,protocol
          ,path
          ,fileMap
        ){
          Ispaces.logger.debug('callback(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileMap:'+fileMap+')');
          //Ispaces.logger.debug('Common.isString(fileMap) = '+Common.isString(fileMap));
          //Ispaces.logger.debug('arguments.length = '+arguments.length);
          //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

          //Ispaces.logger.debug(this.id+'.toggleOpenFolder(listItem:'+listItem+', e:'+e+'): callback(fileMap:'+fileMap+')');
          //Ispaces.logger.debug(this.id+'.toggleOpenFolder(listItem:'+listItem+', e:'+e+'): callback(fileMap:'+Common.getSize(fileMap)+')');

          //Ispaces.logger.debug('path = "'+path+'"');
          //Ispaces.logger.debug('(path==FORWARDSLASH) = "'+(path==FORWARDSLASH)+'"');
          //Ispaces.logger.debug('fileName = "'+fileName+'"');

          /*
           * Create the new path.
           * The switch... the folder name becomes part of the next path.
           */
          //*
          var newPath;
          //if(path==FORWARDSLASH){
          if(origPath==FORWARDSLASH){
            newPath=FORWARDSLASH+fileName;
          }else{
            newPath=new Ispaces.StringBuilder([
              //path
              origPath
              ,FORWARDSLASH
              ,fileName
            ]).asString();
          }
          //*/

          /*
          var newPath=new Ispaces.StringBuilder([
            protocol
            ,this.Constants.COLON
            ,path
          ]).asString();
          Ispaces.logger.debug('newPath = '+newPath);
          */

          //Ispaces.logger.debug('newPath = "'+newPath+'"');

          var unorderedList=_this.createTreeUnorderedList(
            isLocal
            ,protocol
            ,newPath
            //,path
            ,fileMap
            ,_this.cellPanel  // Temporary - might be a better way of setting this or not setting it at all. This is added here so the panel can keep a reference to its drop folders.
          );
          //Ispaces.logger.debug('unorderedList = '+unorderedList);

          //unorderedList.cellPanel=cellPanel; // Set a reference to the cellPanel on the UL.
          unorderedList.setMarginLeft('8px'); // Indent the sub folders.
          //listItem.setClass('open');
          //listItem.setClass('');
          //listItem.setClass(listItem.cn);
          unorderedList.listItem=listItem; // Set a reference to the parent LI on the child UL.
          unorderedList.parentListItem=listItem; // Set a reference to the parent LI on the child UL. TBD

          //listItem.add(unorderedList);
          if(refresh){
            //listItem.add(unorderedList);
            //listItem.replace(unorderedList,listItem.childUnorderedList);
            listItem.replace(unorderedList,listItem.unorderedList);       // Replace the UL.
            //listItem.replaceFirst(unorderedList);
            //listItem.unorderedList=unorderedList;
          }else{
            listItem.add(unorderedList);
          }

          listItem.unorderedList=unorderedList; // Set a reference to the child UL. @see upArrow().
          //listItem.childUnorderedList=unorderedList;
          //listItem.childUnorderedList=unorderedList;

          //Ispaces.logger.debug('listItem.unorderedList = '+listItem.unorderedList);
          //listItem.unorderedList.show();
          unorderedList.show();
          //this.openListItem(listItem);
        };

        //Ispaces.Files.getAsync(isLocal,protocol,path,fileName,callback);

        Ispaces.Files.getAsync(
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

      listItem.isOpen=false;
      if(listItem.unorderedList)listItem.unorderedList.hide();
      //if(listItem.childUnorderedList)listItem.childUnorderedList.hide();
      //this.closeListItem(listItem);

    }

    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }

  /*
  ,mouseUpPanelCapturing:function(cellPanel){
    Ispaces.logger.debug(this.id+'.mouseUpPanelCapturing(cellPanel:'+cellPanel+')');

    var divFiles=cellPanel.divFiles;
    Ispaces.logger.debug('divFiles = '+divFiles);

    var scrollTopPrev=divFiles.scrollTopPrev;

    var scrollTop=divFiles.scrollTop;
    Ispaces.logger.debug('scrollTop = '+scrollTop);
    Ispaces.logger.debug('scrollTopPrev = '+scrollTopPrev);
    divFiles.scrollTopPrev=scrollTop;

    if(scrollTopPrev){
      if(scrollTopPrev!=scrollTop){
        //this.resetPositions(scrollTop);
        this.resetPositions(cellPanel,scrollTop);
      }
    }
  }
  */


  //,clickTableRow:function(
    //Ispaces.logger.debug(this.id+'.clickTableRow(tableRow:'+tableRow+', e:'+e+')');
  ,mouseDownTableRow:function(tableRow,e){
    Ispaces.logger.debug(this.id+'.mouseDownTableRow(tableRow:'+tableRow+', e:'+e+')');

    /*
    //Ispaces.logger.object(e);
    Ispaces.logger.debug('button = '+button);
    Ispaces.logger.debug('e.shiftKey = '+e.shiftKey);
    Ispaces.logger.debug('e.ctrlKey = '+e.ctrlKey);
    Ispaces.logger.debug('e.altKey = '+e.altKey);
    //Ispaces.logger.debug('e.button = '+e.button);
    //Ispaces.logger.debug("e['button'] = "+e['button']);
    //var fileName=tableRow.fileName;
    //Ispaces.logger.debug('fileName = '+fileName);
    //var tbody=tableRow.parentNode; // TBODY
    //*/

    var panelActive=this.cellPanel; // Get the active panel
    Ispaces.logger.debug('panelActive = '+panelActive);

    var selectedFileElements=panelActive.selectedFileElements; // Get the list of selected items from the active panel.
    if(!selectedFileElements)selectedFileElements=panelActive.selectedFileElements=[];
    Ispaces.logger.debug('selectedFileElements.length = '+selectedFileElements.length);

    var multipleSelected=(selectedFileElements.length>1); // Are there files already selected?
    Ispaces.logger.debug('multipleSelected = '+multipleSelected);

    if(e&&e.ctrlKey){ // If this is a CTRL-Click operation.
      //this.toggleMultipleSelect(listItem);

      //if(tableRow.on){
      //if(tableRow.checkbox.checked){
      //if(tableRow.isChecked){
      //if(listItem.on){
      if(tableRow.isSelected){   // 'isChecked', 'on' - now named 'selected'

        /*
        this.deselectTableRow(tableRow);
        this.tableRows.remove(tableRow);
        */
        this.deselectFileElement(tableRow);
        selectedFileElements.removeNode(tableRow);

      }else{

        /*
        this.selectTableRow(tableRow);
        //this.tableRows.push(tableRow);
        this.multipleSelected=true;
        */
        if(!multipleSelected)selectedFileElements.push(panelActive.fileElement); // Add the previous selected file element. We are doing a multiple select using the CTRL key.
        selectedFileElements.push(tableRow); // Add the list item to the array of selected items in this panel.

        //this.selectFileElement(tableRow);
        this.selectTableRow(tableRow);

        //this.multipleFilesSelected=true;

      }
    }else{

      /*
      if(this.multipleSelected)this.deselectAll();
      if(this.tableRow){
        this.deselectTableRow(this.tableRow); // Deselect the previous selected row, if any.
        //this.tableRows.removeNode(tableRow);
      }
      */
      if(multipleSelected){

        //this.deselectAllFileElements();
        //for(var i=0;i<selectedFileElements.length;i++)this.deselectFileElement(selectedFileElements[i]);
        //selectedFileElements.forEach(this.deselectFileElement.bind(this));
        selectedFileElements.forEach(this.deselectTableRow.bind(this));

        selectedFileElements.clear();
        multipleSelected=false;

      }else{

        //selectedFileElements.clear();
        //if(panelActive.fileElement)this.deselectFileElement(panelActive.fileElement);
        if(panelActive.fileElement)this.deselectTableRow(panelActive.fileElement);
      }

      /*
      this.selectFileElement(listItem);
      selectedFileElements.push(listItem); // Add the list item to the array of selected items.
      */
      //if(tableRow.checkbox.checked){
      //if(tableRow.isChecked){
      if(tableRow.selected){
        this.deselectTableRow(tableRow);
        //this.tableRows.removeNode(tableRow);
      }else{
        this.selectTableRow(tableRow);
        //this.tableRows.push(tableRow);
      }

    }

    /*
     * DnD - Drag & Drop
     * Check which button was clicked 0 = left click, 2 = right click.
     */
    //var button=e.button;  // Obfuscation issue here needs to be resolved.
    var button=e['button']; // Temporary fix for obfuscation issue above. Hard code the 'button' identifier.
    var which=e['which']; // get which button was clicked. 1 = left click, 3 = right click

    //*
    //Ispaces.logger.object(e);
    Ispaces.logger.debug('button = '+button);
    Ispaces.logger.debug('which = '+which);
    //Ispaces.logger.debug('e.shiftKey = '+e.shiftKey);
    //Ispaces.logger.debug('e.ctrlKey = '+e.ctrlKey);
    //Ispaces.logger.debug('e.altKey = '+e.altKey);
    //Ispaces.logger.debug('e.button = '+e.button);
    //Ispaces.logger.debug("e['button'] = "+e['button']);
    //*/

    if(
      (button!=null&&button===0)  // Left click only (Firefox)
      ||(which!=null&&which===1)  // Left click only (Mac, IE)
      ||Constants.isTouchDevice       // Or, if this is a touch device create the touchmove handler ontouchdown
      &&!tableRow.mouseMoveFunction   // Sometimes the dragging gets stuck on.
    ){

      //*
      var mouseDownXY=Common.getMouseXY(e)
      ,mouseDownX=mouseDownXY[0]
      ,mouseDownY=mouseDownXY[1]
      ;
      //*/

      //*
      tableRow.mouseMoveFunction=this.mouseMove.bind( // [native code]
        this
        ,tableRow
        ,mouseDownX
        ,mouseDownY
      );
      //*/

      //Ispaces.logger.debug('TBD - Removed this.z1000()');
      //tableRow.z1000();

      Common.addListener(
        document
        ,Constants.Events.MOUSEMOVE
        ,tableRow.mouseMoveFunction
      );
    }

    Common.stopEventPropagation(e); // Stop the event from propogating to the panel and creating a panel drag event.
    Common.killEvent(e); // Stop the event from propogating to the panel and creating a panel drag event.

    return false;
  }

  ,mouseUpTableRow:function(tableRow,e){
    Ispaces.logger.debug(this.id+'.mouseUpTableRow(tableRow:'+tableRow+', e:'+e+')');

    /*
     * DnD - Drag & Drop
     * Check which button was clicked 0 = left click, 2 = right click.
     */
    //var button=e.button;  // Obfuscation issue here needs to be resolved.
    //var button=e['button']; // Temporary fix for obfuscation issue above. Hard code the 'button' identifier.

    /*
     * Activate the drag on left click only. button == 0, which == 1
     * Right-click on Mac: button == 2
     */
    /*
    if(
      //button==0 // Mac uses CTRL-Click to activate the context menu, so we need to check for that here before creating a mouse
      which==1 // Mac uses CTRL-Click to activate the context menu, so we need to check for that here before creating a mouse
      &&!this.mouseMoveFunction // Sometimes the dragging gets stuck on.
    ){
    */
    //Ispaces.logger.debug('tableRow.mouseMoveFunction = '+tableRow.mouseMoveFunction);
    Ispaces.logger.debug('typeof tableRow.mouseMoveFunction = '+typeof tableRow.mouseMoveFunction);
    if(tableRow.mouseMoveFunction){

      Common.removeListener(
        document
        ,Constants.Events.MOUSEMOVE
        ,tableRow.mouseMoveFunction
      );

      tableRow.mouseMoveFunction=null;
    }

    Common.stopEventPropagation(e); // Stop the event from propogating to the panel and creating a panel drag event.
    //Common.killEvent(e); // Stop the event from propogating to the panel and creating a panel drag event.

    return false;
  }

  ,selectTableRow:function(tableRow){
    Ispaces.logger.debug(this.id+'.selectTableRow('+tableRow+')');

    tableRow.setClass("selected");  // Set the background color (selected) by setting the className.

    //tableRow.checkbox.checked=true; // Check/Uncheck the checkbox.
    //tableRow.isChecked=true; // Check/Uncheck the checkbox.
    //tableRow.on=true; // Now using tableRow.checkbox.checked
    tableRow.isSelected=true;

    this.tableRows.push(tableRow);  // Add the entry to the tableRows array.

    this.tableRow=tableRow; // set the tableRow as property this.tableRow
    //Ispaces.logger.debug(this.id+'.selectTableRow('+tableRow+'): tableRow.username = '+tableRow.username);

    this.cellPanel.fileElement=tableRow;

    /*
    var fileName=tableRow.fileName;
    Ispaces.logger.debug(this.id+'.selectTableRow('+tableRow+'): fileName = '+fileName);

    var equalsFileName=this.equalsFileName.bind(
      this
      ,fileName
      //,this.INDEX_ID
      ,Ispaces.ContactIndex.ID
    ); // Create a function object by binding the local function equalsFileName to this object, passing in the userId.

    //Ispaces.logger.debug('equalsFileName = '+equalsFileName);

    var indexOfContact=this.arrayIndexOf(this.contacts,equalsFileName); // Get the array index of of the contact,
    Ispaces.logger.debug('indexOfContact = '+indexOfContact);

    //var contact=this.contacts[indexOfContact];
    //Ispaces.logger.debug('contact = '+contact);

    //var singleContactArray=this.contacts.filter(function (person) { return person.dinner == "sushi" });
    var singleContactArray=this.contacts.filter(equalsFileName); // Use native Array.filter() to extract/search for the contact by userId. The filter should only return one match/result.
    //Ispaces.logger.debug('singleContactArray = '+singleContactArray);

    var contact=singleContactArray[0];
    Ispaces.logger.debug('contact = '+contact);

    //contact[this.INDEX_CHECKED]=true; // Set the 7th elements in the contact array to true.
    contact[Ispaces.ContactIndex.CHECKED]=true; // Set the 7th elements in the contact array to true.
    */
  }

  ,deselectTableRow:function(tableRow){
    Ispaces.logger.debug(this.id+'.deselectTableRow(tableRow:'+tableRow+')');

    //Ispaces.logger.debug('tableRow.checkbox = '+tableRow.checkbox);

    tableRow.setClass(tableRow.cssName);  // Reset the background color, by resetting the className.

    //tableRow.on=false;
    //tableRow.checkbox.checked=false;      // Uncheck the checkbox.
    //tableRow.isChecked=false;      // Uncheck the checkbox.
    tableRow.isSelected=false;

    this.tableRows.remove(tableRow);      // Remove the entry from the tableRows array.

    /*
    var fileName=tableRow.fileName;
    Ispaces.logger.debug('fileName = '+fileName);

    var equalsFileName=this.equalsFileName.bind(
      this
      ,fileName
      //,this.INDEX_ID
      ,Ispaces.ContactIndex.ID
    ); // Create a function object by binding the local function equalsFileName to this object, passing in the fileName.

    //var indexOfContact=this.arrayIndexOf(this.contacts,equalsFileName); // Get the array index of of the contact,
    var singleContactArray=this.contacts.filter(equalsFileName); // Use native Array.filter() to extract/search for the contact by fileName. The filter should only return one match/result.

    //Ispaces.logger.debug('fileName = '+fileName);
    //Ispaces.logger.debug('equalsFileName = '+equalsFileName);
    //Ispaces.logger.debug('indexOfContact = '+indexOfContact);
    //Ispaces.logger.debug('singleContactArray = '+singleContactArray);

    var contact=singleContactArray[0];
    Ispaces.logger.debug('contact = '+contact);

    //contact[this.INDEX_CHECKED]=false;
    contact[Ispaces.ContactIndex.CHECKED]=false; // Set the element in the contact array to false.
    */
  }

  /**
   * Selecting a folder opens the folder to reveal the sub folders.
   *
   * @param e the event object
   * @param div the DIV inside this list item that holds the icon and name.
   * @param listItem the list item for this file.
   */
  ,selectFile:function(e,div,listItem){
  }

  ,toggleMultipleSelect:function(listItem){
    Ispaces.logger.debug(this.id+'.toggleMultipleSelect(listItem.fileName:'+listItem.fileName+')');

    Ispaces.logger.debug('listItem.isSelected = '+listItem.isSelected);

    if(listItem.isSelected){

      this.deselectFileElement(listItem);
      this.fileElements.remove(listItem);

    }else{
      //listItem.isSelected=true;

      if(!this.multipleFilesSelected){
        //this.fileElements.push(this.listItem); // Add the previous selected li. We are doing a multiple select using the CTRL key.
        this.fileElements.push(this.fileElement); // Add the previous selected li. We are doing a multiple select using the CTRL key.
      }

      this.fileElements.push(listItem);
      this.selectFileElement(listItem);
      this.multipleFilesSelected=true;
    }

    //Ispaces.logger.debug(this.id+'.toggleMultipleSelect(listItem): this.selectedFiles.size() = '+this.selectedFiles.size());
  }

  ,deselectAllFileElements:function(){
    Ispaces.logger.debug(this.id+'.deselectAllFileElements()');

    //Ispaces.logger.debug('this.fileElements.length = '+this.fileElements.length);

    //for(var i=0;i<this.fileElements.length;i++)this.deselectFileElement(this.fileElements[i]);
    //var _this=this;_this.fileElements.forEach(function(fileElement){_this.deselectFileElement(fileElement)});
    this.fileElements.forEach(this.deselectFileElement.bind(this));

    this.multipleFilesSelected=false;
    this.fileElements.clear();
    //this.listItem=null;
  }

  ,selectFileElement:function(fileElement){
    Ispaces.logger.debug(this.id+'.selectFileElement(fileElement:'+fileElement+')');

    Ispaces.logger.debug('fileElement.fileName = '+fileElement.fileName);
    Ispaces.logger.debug('fileElement.filePath = '+fileElement.filePath);

    /*
    var fileElementSelected=this.fileElement;
    Ispaces.logger.debug('fileElementSelected = '+fileElementSelected);

    //if(this.multipleFilesSelected){
    if(fileElementSelected){
      this.fileElements.push(fileElement);
      this.multipleFilesSelected=true;
    }
    */

    //fileElement.scrollIntoView();
    //this.fileElements.push(fileElement);
    //Ispaces.logger.debug(this.id+'.selectFileElement(fileElement): this.fileElements.length = '+this.fileElements.length);
    //fileElement.on=true;
    fileElement.selected=true;

    //this.fileElement=fileElement;
    this.fileElement=fileElement;

    //this.panel.fileElement=fileElement;

    //this.cellPanel.fileElement=fileElement;
    this.cellPanel.fileElement=fileElement;

    //fileElement.setBorder(Constants.Borders.RED);

    /*
    this.fileElements.push(fileElement);
    Ispaces.logger.debug(this.id+'.selectFileElement('+fileElement+'): this.fileElements.length = '+this.fileElements.length);
    if(this.fileElements.length>1){
      this.multipleFilesSelected=true;
    }
    //*/

    /*
    Ispaces.logger.debug(this.id+'.selectFileElement(fileElement): this.leftRight.id = '+this.leftRight.id);
    //this.left.fileElement=fileElement;
    //this.left.filePath=fileElement.filePath;
    this.leftRight.root=fileElement.root;
    this.leftRight.fileElement=fileElement;
    this.leftRight.filePath=fileElement.filePath;
    this.leftRight._size=fileElement._size;
    this.leftRight.isLocal=fileElement.root.isLocal;
    Ispaces.logger.debug(this.id+'.selectFileElement(fileElement): this.leftRight.filePath = '+this.leftRight.filePath+', this.leftRight.isLocal = '+this.leftRight.isLocal);
    Ispaces.logger.debug(this.id+'.selectFileElement(fileElement): this.left.filePath = '+this.left.filePath+', this.right.filePath = '+this.right.filePath);
    */

    //fileElement.setClass('selected');
    //fileElement.addAll('selected');
    //fileElement.span.setClass('selected');
    //fileElement.div.setClass("selected");
    fileElement.div.setClass("selected");

    //fileElement.divFiles.setClass('selected');
    //if(this.cell)this.cell.tree.fileElement=fileElement; // Set the selected LI as a property of its tree.
  }

  ,deselectFileElement:function(fileElement){
    Ispaces.logger.debug(this.id+'.deselectFileElement(fileElement:'+fileElement+')');

    Ispaces.logger.debug('fileElement.fileName = '+fileElement.fileName);
    Ispaces.logger.debug('fileElement.filePath = '+fileElement.filePath);

    /*
    if(this.multipleFilesSelected){
      this.deselectAllFileElements();
      return;
    }
    */

    //fileElement.on=false;
    //fileElement.on=false;
    fileElement.isSelected=false;

    //this.fileElement=fileElement;
    //this.panel.fileElement=fileElement;
    //this.panel.fileElement=null;
    //this.cellPanel.fileElement=null;
    this.cellPanel.fileElement=null;

    //fileElement.dCN('selected');
    //fileElement.setClass('');
    //fileElement.setClass(fileElement.cn);
    //fileElement.span.setClass('');
    //fileElement.div.setClass('');
    //fileElement.div.setClass('');
    // This needs fixing. Some fileElements have a .div oters do not.
    if(fileElement.div){
      fileElement.div.setClass('');
    }else{
      Ispaces.logger.warn(this.id+'.deselectFileElement(fileElement:'+fileElement+'): fileElement.div = '+fileElement.div);
    }

    //this.fileElements.remove(fileElement);
    //Ispaces.logger.debug(this.id+'.deselectFileElement(fileElement): this.fileElements.length = '+this.fileElements.length);
    //fileElement.divFiles.setClass('file');  // Deselect the previous selected folder
  }

  ,updateData:function(checked){
    Ispaces.logger.debug(this.id+'.updateData('+checked+')');

    Ispaces.logger.debug('this.contacts = '+this.contacts);
    Ispaces.logger.debug('this.contacts.length = '+this.contacts.length);

    var i=0
    ,z=this.contacts.length
    //,INDEX_CHECKED=this.INDEX_CHECKED
    ,INDEX_CHECKED=Ispaces.ContactIndex.CHECKED
    ;

    for(i;i<z;i++){
      this.contacts[i][INDEX_CHECKED]=true; // Set the nth element in the contact array to true.
    }
  }


  /*
  ,mouseDownTableRow:function(
    tableRow
    ,div
    ,e
  ){
    Ispaces.logger.debug(this.id+'.mouseDownTableRow(tableRow:"'+tableRow.fileName+'", div:'+div+', e:'+e+')');

    if(div)this.divFiles=div;
    var cell=this.divFiles.cell; // Get the cell.
    Ispaces.logger.warn('cell = '+cell);

    //if(!cell.selected){ // If the cell is not selected.
    //  if(this.cell)this.deselectCell(this.cell); // Deselect the previous selected cell.
    //  cell.selected=true;
    //  this.cell=cell;
    //  this.pathDiv=this.cell.pathDiv;
    //  this.pathDiv.input.setClass(ON);
    //}
    if(!cell.on){ // If the cell is not selected.
      if(this.cell)this.deselectCell(this.cell); // Deselect the previous selected cell.
      this.selectCell(cell); // Deselect the previous selected cell.
    }

    //if(tableRow&&tableRow.file)this.selectedFile=tableRow.file;
    //var file=new File(protocol,path,name,size,date);

    //this.divFiles.table.tbody.firstChild // TR
    //this.divFiles.table.tbody.firstChild.firstChild // TD0
    var tbody=tableRow.parentNode; // TBODY

    if(e&&e.ctrlKey){
      //this.toggleMultipleSelect(listItem);
      if(tableRow.on){
        //this.deselect(listItem);
        this.deselectTableRow(tableRow);
        this.tableRows.remove(tableRow);
        //log.debug(this.id+'.mouseDownTableRow('+tableRow+'): this.selectedFiles.length = '+this.selectedFiles.length);
        //this.selectedFiles.remove(tableRow.name);
        //if(this.selectedFiles)this.selectedFiles.remove(tableRow.name);
      }else{
        //if(!this.selectedFiles)this.selectedFiles=[];//    or an Array .. which will be faster?
        this.selectTableRow(tableRow);
        this.tableRows.push(tableRow);
        this.multipleSelected=true;
        //this.selectedFiles[tableRow.index]={fileName:listItem.fileName,username:listItem.username};
        //this.selectedFiles[tableRow.name]={fileName:listItem.fileName,username:listItem.username};
        //log.debug(this.id+'.mouseDownTableRow('+tableRow+'): this.selectedFiles.length = '+this.selectedFiles.length);
        //this.selectedFiles.push(tableRow.name);
        //log.debug(this.id+'.mouseDownTableRow('+tableRow+'): this.selectedFiles.length = '+this.selectedFiles.length);
      }
    }else{
      if(this.multipleSelected)this.deselectAll();
      if(this.tableRow){
        this.deselectTableRow(this.tableRow); // Deselect the previous selected row, if any.
        this.tableRows.remove(this.tableRow);
      }
      if(tableRow.on){
        this.deselectTableRow(tableRow);
        this.tableRows.remove(tableRow);
      }else{
        this.selectTableRow(tableRow);
        this.tableRows.push(tableRow);
      }
    }

    this.tbody=tbody;
  }
  */

  ,doubleClickTableRow:function(tableRow,e){
    Ispaces.logger.debug(this.id+'.doubleClickTableRow(tableRow:'+tableRow+', e:'+e+')');

    //var _this=this;

    var isLocal=tableRow.isLocal
    ,protocol=tableRow.protocol
    ,path=tableRow.path
    ,origPath=tableRow.path
    ,fileName=tableRow.fileName
    //,refresh=tableRow.refresh
    //,refresh=tableRow.refresh||false
    ;

    //*
    Ispaces.logger.debug('isLocal = '+isLocal);
    Ispaces.logger.debug('protocol = '+protocol);
    Ispaces.logger.debug('path = '+path);
    Ispaces.logger.debug('origPath = '+origPath);
    Ispaces.logger.debug('fileName = '+fileName);
    //Ispaces.logger.debug('refresh = '+refresh);
    Ispaces.logger.debug('tableRow.isDir = '+tableRow.isDir);
    //*/

    if(tableRow.isDir){ // We have a directory.

      var _this=this
      ,FORWARDSLASH=_this.Constants.FORWARDSLASH
      ;

      var callback=function(
        isLocal
        ,protocol
        ,path
        ,fileMap
      ){
        Ispaces.logger.debug('callback(isLocal:'+isLocal+', protocol:"'+protocol+'", path:"'+path+'", fileMap:'+fileMap+')');

        var newPath;
        if(origPath==FORWARDSLASH){
          newPath=FORWARDSLASH+fileName;
        }else{
          newPath=new Ispaces.StringBuilder([
            origPath
            ,FORWARDSLASH
            ,fileName
          ]).asString();
        }

        Ispaces.logger.debug('newPath = "'+newPath+'"');

        var cellPanel=_this.cellPanel;            // The currently active cellPanel.
        var cellFiles=cellPanel.cellFiles;  // The currently active cellFiles.

        var table=_this.createTableFiles(
          isLocal
          ,protocol
          ,newPath
          ,fileMap
          ,cellPanel
        );

        Ispaces.logger.debug('table = '+table);

        /*
        var tbody=table.tbody;
        Ispaces.logger.debug('tbody = '+tbody);
        Ispaces.logger.alert('tbody = '+tbody);

        cellPanel.tbody=tbody;

        _this.replaceTbody(tbody);
        */
        //_this.divFiles.replace(table);

        //Ispaces.logger.debug('_this.cellPanel.divFiles = '+_this.cellPanel.divFiles);
        //_this.cellPanel.divFiles.replaceFirst(table);
        Ispaces.logger.debug('_this.cellPanel.cellFiles = '+_this.cellPanel.cellFiles);
        _this.cellPanel.cellFiles.replaceFirst(table);

        _this.resetPositions(); // for dnd
      };

      Ispaces.Files.getAsync(
        isLocal
        ,protocol
        ,path
        ,fileName
        ,callback
        //,refresh
        //,false // refresh override
        //,true // refresh override
      );

    }else{
      //Ispaces.applications.launchFileName({filePath:tableRow.filePath}); // Launcher is a static class
      Ispaces.Launcher.launchFileName({filePath:tableRow.filePath});
    }

    //this.resetFolderPositions(); // for dnd
    //this.resetPositions(); // for dnd - moved to callback above
  }
  ,doubleClickTableRowBak:function(tableRow){
    Ispaces.logger.alert(this.id+'.doubleClickTableRow('+tableRow+')');

    //var root=tableRow.root,protocol=tableRow.protocol,current=tableRow.current,parent=tableRow.parent,path=tableRow.path,fileName=tableRow.fileName,size=tableRow.size;
    var root=tableRow.root,path=root.path;

    //log.debug(this.id+'.doubleClickTableRow(tableRow): protocol = "'+protocol+'", parent = "'+parent+'", path = "'+path+'", name = "'+name+'", size = "'+size+'"');
    //log.debug(this.id+'.doubleClickTableRow(tableRow): root="'+root+'", protocol="'+protocol+'", current="'+current+'", fileName="'+fileName+'", path="'+path+'", parent="'+parent+'"');
    //log.debug(this.id+'.doubleClickTableRow(tableRow): root='+root+', path="'+path+'"');

    //log.debug(this.id+'.doubleClickTableRow(tableRow): tableRow.isDir = '+tableRow.isDir);
    if(tableRow.isDir){ // We have a directory.

      //var fileMap=files.get(protocol,path,name);
      var fileMap=files.get(root);
      //var fileMap=files.get(root,path);

      // Switch the file listing.
      /*
      var fileTable=this.createTableFiles(root,path,fileMap,this.divFiles); // Create the new file table.
      this.divFiles.replaceFirst(fileTable); // Replace the old file table with the new one.
      this.mouseDownTableRow(null,fileTable.tbody.firstChild,this.divFiles); // Simulate the mouse down on the first row, to select it.
      */
      var fileUnorderedList=this.createFileUnorderedList(root,path,fileMap,this.divFiles); // Create the new file listing.
      this.divFiles.replaceFirst(fileUnorderedList); // Replace the old file listing with the new one.
      this.mouseDownTableRow(null,fileUnorderedList.firstChild,this.divFiles); // Simulate the mouse down on the first row, to select it.

      //this.pathDiv.input.value=path; // Update the path input.
      //placeCursor(this.selectedPath.input); // To place the cursor in the path input.

    }else{
      applications.launchFileName({filePath:tableRow.filePath});
    }
  }


  /*
   * Keyboard event handlers.
   */

  /*
   * Focus/Blur - Now handled by the super class 'Application'
   */
  /*
  ,focus:function(){
    Ispaces.logger.debug(this.id+'.focus()');

    this.addListeners();
    //this.mouseDownTableRow(null,fileTable.tbody.firstChild,this.selectedDivFiles);
    //this.mouseDownTableRow(null,this.tableRow,this.selectedDivFiles);
    this.resizableWindow.focus();
  }

  ,blur:function(app){
    Ispaces.logger.debug(this.id+'.blur()');

    this.removeListeners();
    if(app)this.resizableWindow.blur(app);
  }

  ,addKeyListeners:function(){
    if(!this.eventsAdded){
      Ispaces.logger.debug(this.id+'.addKeyListeners()');
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
    Ispaces.logger.debug(this.id+'.removeListeners()');
    this.removeKeyListeners();
  }

  ,removeKeyListeners:function(){
    if(this.eventsAdded){
      Ispaces.logger.debug(this.id+'.removeKeyListeners()');

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
    Ispaces.logger.debug(this.id+'.keyDown('+(e.which||e.keyCode)+')');

    var key=e.which||e.keyCode;
    //Ispaces.logger.debug('key = '+key);

    /*
    if(key==115){ // F4 : Quit.
      this.destroySave(e);
      return;
    }
    */

    if(key==16)this.isShift=true;
    if(key==17)this.isCtrl=true;
    if(key==18)this.isAlt=true;

    //Ispaces.logger.debug(this.id+'.keyDown(e): key = '+key+', this.isShift = '+this.isShift+', this.isCtrl = '+this.isCtrl+', this.isAlt = '+this.isAlt);

    switch(key){

      case 9: // Ispaces.logger.debug('Tab');

        this.tabKey();
        Common.preventDefaultEvent(e);
        break;

      case 13: // Ispaces.logger.debug('Return/Enter');

        this.enterKey(e);
        break;

      case 18: // Ispaces.logger.debug('Alt');

        this.isAlt=true;
        break;

      case 27: // Ispaces.logger.debug('Escape');

        this.escapeKey(e);
        break;

      case 32: // Ispaces.logger.debug('Spacebar');

        this.spacebar();
        break;

      case 35: // Ispaces.logger.debug('End');

        this.end();
        Common.preventDefaultEvent(e);
        return false;
        break;

      case 36: // Ispaces.logger.debug('Home');

        this.home();
        Common.preventDefaultEvent(e);
        return false;
        break;

      case 37: // Ispaces.logger.info('Left Arrow');

        this.leftArrow(e); // Closes a folder if a folder is selected and open in tree mode.
        //Common.preventDefaultEvent(e);
        //return false;
        break;

      case 38: // Ispaces.logger.info('Up Arrow');

        this.upArrow();
        e.preventDefault(); // prevent any scroll action
        break;

      case 39: // Ispaces.logger.info('Right Arrow');

        this.rightArrow(e); // Opens a folder if a folder is selected in tree mode.
        //Common.preventDefaultEvent(e);
        //return false;
        break;

      case 40: // Ispaces.logger.info('Down Arrow');

        this.downArrow();
        //Common.preventDefaultEvent(e);
        e.preventDefault(); // prevent any scroll action
        //return false;
        break;

      case 46: // Ispaces.logger.debug('Delete');
      case 119: // Ispaces.logger.debug('F8');

        this.deleteKey(e);
        break;

      case 115:  Ispaces.logger.debug('F4');

        if(this.isAlt){
          this.destroy();
          this.isAlt=false;
        }
        Common.preventDefaultEvent(e);
        break;

      case 116: // Ispaces.logger.debug('F5');

        this.f5();
        //Common.preventDefaultEvent(e);
        Common.killEvent(e);
        return false;
        break;

      case 117: // Ispaces.logger.debug('F6');

        if(this.isShift){
          e.o=this.tableRow;
          this.rename(e);
          Common.preventDefaultEvent(e);
          return false;
        }
        this.f6();
        Common.preventDefaultEvent(e);
        break;

      case 118: // Ispaces.logger.debug('F7');

        this.f7();
        Common.preventDefaultEvent(e);
        break;

      default:return; // What to do for default?
    }

  }

  ,keyUp:function(e){
    Ispaces.logger.debug(this.id+'.keyUp('+(e.which||e.keyCode)+')');

    var key=e.keyCode;
    //Ispaces.logger.debug('key = '+key+', this.isAlt = '+this.isAlt+', this.isCtrl = '+this.isCtrl);

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
    Ispaces.logger.debug(this.id+'.enterKey('+e+')');

    if(this.modal&&this.modal.on){ // If the modal window is showing, we pass the event on to the modal.
      //Ispaces.logger.debug(this.id+'.enterKey(): this.modal.on = '+this.modal.on);
      this.modal.enterKey(e);
      return;
    }
    //if(this.tableRow)this.doubleClickTableRow(this.tableRow);

    var cellPanel=this.cellPanel
    //,listItem=cellPanel.listItem
    ,fileElement=cellPanel.fileElement
    //,isDir=listItem.isDir
    ,isDir=fileElement.isDir
    ;

    //Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('listItem = '+listItem);
    //Ispaces.logger.debug('isDir = '+isDir);

    if(isDir){
      this.rightArrow(e); // Opens a folder if a folder is selected in tree mode.
    }else{
      //Ispaces.Launcher.launchFileName(listItem,e);
      Ispaces.Launcher.launchFileName(fileElement,e);
      //Common.preventDefaultEvent(e);
    }
  }

  ,upArrow:function(){
    Ispaces.logger.debug(this.id+'.upArrow()');

    var cellPanel=this.cellPanel;
    //Ispaces.logger.debug('cellPanel = '+cellPanel);

    var listItem=cellPanel.listItem;
    var cellFiles=cellPanel.cellFiles;
    var isCtrl=this.isCtrl;

    if(listItem){
      //Ispaces.logger.debug('listItem = '+listItem);
      //Ispaces.logger.debug('listItem.fileName = '+listItem.fileName);

      //listItem.scrollIntoView(true);

      var scrollHeight=cellFiles.scrollHeight;
      //Ispaces.logger.debug('scrollHeight = '+scrollHeight);

      var clientHeight=cellFiles.clientHeight;
      //Ispaces.logger.debug('clientHeight = '+clientHeight);
      //Ispaces.logger.debug('scrollHeight-clientHeight = '+(scrollHeight-clientHeight));

      var scrollTop=cellFiles.scrollTop;
      //Ispaces.logger.debug('scrollTop = '+scrollTop);

      var offsetTop=listItem.offsetTop;
      //Ispaces.logger.debug('offsetTop = '+offsetTop);

      /*
      if(offsetTop>clientHeight){
        //listItem.scrollTo(offsetTop);
        //cellFiles.scrollTo(offsetTop);
        //cellFiles.scrollTop=offsetTop;
        cellFiles.scrollTop=offsetTop-clientHeight;
      }
      */

      var listItemPrevious=listItem.previousSibling;
      if(listItemPrevious){

        //Ispaces.logger.debug('listItemPrevious.fileName = '+listItemPrevious.fileName);

        var isDir=listItemPrevious.isDir
        ,isOpen=listItemPrevious.isOpen
        ;
        //Ispaces.logger.debug('isDir = '+isDir+', isOpen = '+isOpen);

        if(
          isDir
          &&isOpen
        ){
          //Ispaces.logger.debug('listItemPrevious.unorderedList = '+listItemPrevious.unorderedList);
          var unorderedList=listItemPrevious.unorderedList;
          //var unorderedList=listItemPrevious.parentNode;
          //var unorderedList=listItemPrevious.firstChild;
          //Ispaces.logger.debug('unorderedList = '+unorderedList);
          var childNodes=unorderedList.childNodes;
          //Ispaces.logger.debug('childNodes.length = '+childNodes.length);
          if(childNodes.length>0){
            listItemPrevious=childNodes[(childNodes.length-1)];
          }
        }
      }

      //*
      if(!listItemPrevious){ // We must be at the start of a folder. Go up one level.
        //Ispaces.logger.debug('this.listItem.unorderedList = '+this.listItem.unorderedList);
        //Ispaces.logger.debug('this.listItem.unorderedList.parentNode = '+this.listItem.unorderedList.parentNode);
        //Ispaces.logger.debug('this.listItem.unorderedList.parentNode.parentNode = '+this.listItem.unorderedList.parentNode.parentNode);
        //Ispaces.logger.debug('this.listItem.unorderedList.listItem = '+this.listItem.unorderedList.listItem);
        //Ispaces.logger.debug('this.listItem.parentNode = '+this.listItem.parentNode);
        //Ispaces.logger.debug('this.listItem.parentNode == this.listItem.unorderedList = '+(this.listItem.parentNode == this.listItem.unorderedList));
        //Ispaces.logger.debug('this.listItem.parentNode.listItem = '+this.listItem.parentNode.listItem);

        var unorderedListParent=listItem.parentNode;
        //Ispaces.logger.debug('unorderedListParent = '+unorderedListParent);
        //Ispaces.logger.debug('unorderedListParent.parentNode = '+unorderedListParent.parentNode);
        //Ispaces.logger.debug('unorderedListParent.parentNode.parentNode = '+unorderedListParent.parentNode.parentNode);

        var listItemParent=unorderedListParent.listItem;
        //Ispaces.logger.debug('listItemParent = '+listItemParent);
        listItemPrevious=listItemParent;
      }

      if(listItemPrevious){ // We may be at the top of the directory tree.

        //this.deselectFileElement(this.listItem);
        //this.selectFileElement(listItemPrevious);

        if(isCtrl){

          /*
          if(!this.multipleFilesSelected)this.listItems.push(listItem); // Add the previous selected li. We are doing a multiple select using the CTRL key.

          this.listItems.push(listItemPrevious);
          this.multipleFilesSelected=true;

          if(this.goingDown){
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          */

          //this.toggleMultipleSelect(listItemPrevious);

          /*
          if(this.goingDown){
            //this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          //}else{
            this.toggleMultipleSelect(listItem);
          }
          */
          ///*
          //Ispaces.logger.debug('this.goingDown = '+this.goingDown);
          if(this.goingDown){
            //this.goingDown=false;
            //if(this.multipleFilesSelected){
              this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
              this.selectFileElement(listItemPrevious);
              return;
            //}
          }
          //*/

          /*
          if(this.multipleFilesSelected){
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            //this.selectFileElement(listItemNext);
            if(this.goingDown){
              this.goingDown=false;
              this.selectFileElement(listItemPrevious);
              return;
            }
          }
          //*/

          /*
          if(listItem.on){
          //if(!listItem.on){
            //this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            this.toggleMultipleSelect(listItem);
          //  return;
          }else{
            this.toggleMultipleSelect(listItemPrevious);
          }
          //*/

          this.toggleMultipleSelect(listItemPrevious);

          this.goingUp=true;

        }else{

          this.goingUp=false;

          //Ispaces.logger.debug('this.multipleFilesSelected = '+this.multipleFilesSelected);
          if(this.multipleFilesSelected){
            this.deselectAllFileElements();
          }else{
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          this.selectFileElement(listItemPrevious);
        }
        //this.selectFileElement(listItemPrevious);

      }
    }
    this.goingDown=false;
  }

  ,downArrow:function(){
    //Ispaces.logger.debug(this.id+'.downArrow()');

    var cellPanel=this.cellPanel;
    //Ispaces.logger.debug('cellPanel = '+cellPanel);

    var listItem=cellPanel.listItem;
    var cellFiles=cellPanel.cellFiles;
    var isCtrl=this.isCtrl;

    //Ispaces.logger.debug('isCtrl = '+isCtrl);

    if(listItem){
      //Ispaces.logger.debug('listItem = '+listItem);
      //Ispaces.logger.debug('listItem.fileName = '+listItem.fileName);

      var scrollHeight=cellFiles.scrollHeight;
      //Ispaces.logger.debug('scrollHeight = '+scrollHeight);

      var clientHeight=cellFiles.clientHeight;
      //Ispaces.logger.debug('clientHeight = '+clientHeight);
      //Ispaces.logger.debug('scrollHeight-clientHeight = '+(scrollHeight-clientHeight));

      var scrollTop=cellFiles.scrollTop;
      //Ispaces.logger.debug('scrollTop = '+scrollTop);

      var offsetTop=listItem.offsetTop;
      //Ispaces.logger.debug('offsetTop = '+offsetTop);

      if(offsetTop>clientHeight){
        //listItem.scrollTo(offsetTop);
        //cellFiles.scrollTo(offsetTop);
        //cellFiles.scrollTop=offsetTop;
        cellFiles.scrollTop=offsetTop-clientHeight;
      }

      //listItem.scrollIntoView();
      //listItem.scrollIntoView(true);
      //listItem.scrollIntoView(false);

      var listItemNext=listItem.nextSibling;
      var unorderedListParent=listItem.parentNode;
      //Ispaces.logger.debug('unorderedListParent = '+unorderedListParent);
      //Ispaces.logger.debug('unorderedListParent.childNodes.length = '+unorderedListParent.childNodes.length);

      //if(listItemNext)listItemNext.scrollIntoView(false);

      var isDir=listItem.isDir;
      var isOpen=listItem.isOpen;
      //Ispaces.logger.debug('isDir = '+isDir+', isOpen = '+isOpen);
      if(
        isDir
        &&isOpen
      ){
        //var unorderedList=listItem.unorderedList;
        //var unorderedList=listItem.childUnorderedList;
        var unorderedList=listItem.unorderedList;
        //Ispaces.logger.debug('unorderedList = '+unorderedList);
        var childNodes=unorderedList.childNodes;
        //Ispaces.logger.debug('childNodes.length = '+childNodes.length);
        if(childNodes.length>0){
          //var listItem0=childNodes[0];
          listItemNext=childNodes[0];
        }
      }

      if(!listItemNext){ // We must be at the end of a folder. Go up one level.
        //var index=unorderedListParent.getIndex(listItemNext);
        //Ispaces.logger.debug('index = '+index);
        listItemNext=unorderedListParent.parentNode.nextSibling;
      }

      if(listItemNext){ // We may be at the bottom of the directory tree.

        //Ispaces.logger.debug(this.id+'.downArrow(): listItemNext.fileName = '+listItemNext.fileName);

        /*
        if(!isCtrl){
          if(this.multipleFilesSelected){
            this.deselectAllFileElements();
          }else{
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
        }
        this.selectFileElement(listItemNext);
        */

        if(isCtrl){

          /*
          if(!this.multipleFilesSelected)this.listItems.push(listItem); // Add the previous selected li. We are doing a multiple select using the CTRL key.
          this.listItems.push(listItemNext);
          this.multipleFilesSelected=true;
          */

          //this.toggleMultipleSelect(listItemNext);
          //this.toggleMultipleSelect(listItem);

          /*
          if(this.goingUp){
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }else{
            this.toggleMultipleSelect(listItem);
          }
          if(this.goingUp){
            //this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            this.toggleMultipleSelect(listItem);
          }
          */
          //if(this.goingUp){
          //  this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          //}
          /*
          if(this.goingUp){
            this.toggleMultipleSelect(listItem);
          }else{
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          */

          //*
          //Ispaces.logger.debug('this.goingUp = '+this.goingUp);
          if(this.goingUp){
            //this.goingUp=false;
            //if(this.multipleFilesSelected){
              this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
              this.selectFileElement(listItemNext);
              return;
            //}
          }
          //*/

          /*
          if(this.multipleFilesSelected){
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            //this.selectFileElement(listItemNext);
            if(this.goingUp){
              this.goingUp=false;
              this.selectFileElement(listItemNext);
              return;
            }
          }
          //*/

          /*
          if(listItem.on){
            //this.selectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
            this.toggleMultipleSelect(listItem);
            //return;
          }else{
            this.toggleMultipleSelect(listItemNext);
          }
          //*/

          this.toggleMultipleSelect(listItemNext);

          /*
          var listItemNextOn=listItemNext.on;
          Ispaces.logger.debug('listItemNextOn = '+listItemNextOn);
          if(listItemNextOn){
          }
          */

          this.goingDown=true;

        }else{

          this.goingDown=false;

          //*
          //Ispaces.logger.debug('this.multipleFilesSelected = '+this.multipleFilesSelected);
          if(this.multipleFilesSelected){
            this.deselectAllFileElements();
          }else{
            this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          }
          //*/
          this.selectFileElement(listItemNext);
        }
        //this.selectFileElement(listItemNext);

        //this.toggleMultipleSelect(listItemNext);

        //Ispaces.logger.debug('listItemNext = '+listItemNext);
        //if(!isCtrl)this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.toggleMultipleSelect(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.clickListItem(e,listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.clickListItem(null,listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
        //if(!isCtrl)this.deselectAllFileElements(); // Holding the CTRL key allow select multiple. So, do not deselect the selected.

        /*
        if(!isCtrl){
          if(this.multipleFilesSelected){
            this.deselectAllFileElements();
          }
          this.deselectFileElement(listItem); // Holding the CTRL key allow select multiple. So, do not deselect the selected.
          //this.toggleMultipleSelect(listItem);
        }else{

          this.selectFileElement(listItemNext);
          this.listItems.push(listItemNext);

          if(listItem.on){
            this.deselectFileElement(listItem);
            this.listItems.remove(listItem);
          }else{
            this.selectFileElement(listItem);
            this.listItems.push(listItem);
            this.multipleFilesSelected=true;
          }
        }
        */

        /*
          Ispaces.logger.debug('isCtrl = '+isCtrl);
          this.toggleMultipleSelect(listItem);
          //this.toggleMultipleSelect(listItem,div);
        }else{
          if(this.multipleFilesSelected){
            this.deselectAllFileElements();
          //}else{
          //  this.listItems.clear();
          //  if(this.listItem)this.deselectFileElement(this.listItem);
          }
        }
        */

        //this.selectFileElement(listItemNext);
        //this.listItems.push(listItemNext);
        //this.toggleMultipleSelect(listItemNext);
        //this.mouseDownTableRow(null,this.tableRow,this.selectedDivFiles);
      }
    }
    this.goingUp=false;
  }

  ,rightArrow:function(e){
    Ispaces.logger.debug(this.id+'.rightArrow('+e+')');

    /*
    if(this.listItem){
      if(this.listItem.isDir){
        //this.listItem.isOpen=false;
        //this.toggleOpenFolder(e,this.listItem);
        this.toggleOpenFolder(this.listItem,e);
      }
    }
    */
    if(this.fileElement){
      if(this.fileElement.isDir){
        //this.fileElement.isOpen=false;
        //this.toggleOpenFolder(e,this.fileElement);
        this.toggleOpenFolder(this.fileElement,e);
      }
    }

    e.preventDefault(); // prevent the right arrow from scrolling the page right, where a window has crossed the right side of the browser viewport.
  }

  ,leftArrow:function(e){
    Ispaces.logger.debug(this.id+'.leftArrow('+e+')');

    /*
    if(this.listItem){
      //Ispaces.logger.debug('this.listItem = '+this.listItem);
      if(this.listItem.isDir){
        //Ispaces.logger.debug('this.listItem.isDir = '+this.listItem.isDir);
        //this.toggleOpenFolder(e,this.listItem);
        this.toggleOpenFolder(this.listItem,e);
      }
    }
    */
    if(this.fileElement){
      //Ispaces.logger.debug('this.fileElement = '+this.fileElement);
      if(this.fileElement.isDir){
        //Ispaces.logger.debug('this.fileElement.isDir = '+this.fileElement.isDir);
        //this.toggleOpenFolder(e,this.fileElement);
        this.toggleOpenFolder(this.fileElement,e);
      }
    }
  }

  ,end:function(){
    //Ispaces.logger.debug(this.id+'.end()');
    //Ispaces.logger.debug(this.id+'.end(): this.cell = '+this.cell+', this.cell.tree = '+this.cell.tree);

    /*
    if(this.cell.tree){
      if(this.listItem){
        var listItemNext=this.listItem.nextSibling;
        if(listItemNext){
          this.deselectFileElement(this.listItem);
          this.selectFileElement(listItemNext);
          //this.mouseDownTableRow(null,this.tableRow,this.selectedDivFiles);
        }
      }
    }else{
      if(this.tableRow){
        var rowDown=this.tableRow.nextSibling;
        if(rowDown){
          this.deselectTableRow(this.tableRow);
          this.selectTableRow(rowDown);
          //this.mouseDownTableRow(null,this.tableRow,this.selectedDivFiles);
        }
      }
    }
    */
    var tbody=this.tableRow.parentNode; // TBODY
    var childNodes=tbody.childNodes;
    if(childNodes){
      this.deselectTableRow(this.tableRow);
      this.selectTableRow(childNodes[childNodes.length-1]);
    }
  }

  ,home:function(){
    //Ispaces.logger.debug(this.id+'.home()');
    var tbody=this.tableRow.parentNode; // TBODY
    this.deselectTableRow(this.tableRow);
    this.selectTableRow(tbody.firstChild);
  }

  ,spacebar:function(){
    Ispaces.logger.debug(this.id+'.spacebar()');

    //Ispaces.logger.debug(this.id+'.spacebar(): this.tableRow = '+this.tableRow);
    //Ispaces.logger.debug(this.id+'.spacebar(): this.tableRow.path = '+this.tableRow.path);
    //Ispaces.logger.debug(this.id+'.spacebar(): this.tableRow.fullPath = '+this.tableRow.fullPath);
    //this.selectedPath.input.value=this.rowSelected.path;
    //this.selectedPath.input.value=this.rowSelected.fullPath;
    if(this.selectedPath)this.selectedPath.input.value=this.tableRow.fullPath;
  }

  ,escapeKey:function(e){
    Ispaces.logger.debug(this.id+'.escapeKey()');

    if(this.modal&&this.modal.on){ // If the modal window is showing, we pass the event on to the modal.
      this.modal.escapeKey(e);
      return;
    }
    if(this.selectedPath)this.selectedPath.input.value=this.tableRow.path;
  }

  ,deleteKey:function(e){
    Ispaces.logger.debug(this.id+'.deleteKey('+e+')');
    //this.del();
    this.del(e);
    //if(this.selectedPath)this.selectedPath.input.value=this.tableRow.path;
  }

  ,f5:function(){
    Ispaces.logger.debug(this.id+'.f5()');
    this.clickCopy();
  }

  ,f6:function(){
    Ispaces.logger.debug(this.id+'.f6()');
    this.clickMove();
  }

  ,f7:function(){
    //Ispaces.logger.debug(this.id+'.f7()');
    this.newFolder();
  }

  ,tabKey:function(){
    Ispaces.logger.debug(this.id+'.tabKey()');
    Ispaces.logger.warn(this.id+'.tabKey(): TBD - panelIndex is out.');

    var cellPanel=this.cellPanel
    ,panelIndex=cellPanel.panelIndex
    ,panelCells=this.panelCells
    ,panelCellsLength=panelCells.length
    ;

    Ispaces.logger.debug('panelCellsLength = '+panelCellsLength);
    Ispaces.logger.debug('panelIndex = '+panelIndex);
    Ispaces.logger.debug('this.isShift = '+this.isShift);

    if(this.isShift){
      --panelIndex;
      if(panelIndex<0)panelIndex=(panelCellsLength-1);
    }else{
      ++panelIndex;
      if(panelIndex>=panelCellsLength)panelIndex=0;
    }
    //Ispaces.logger.debug('panelIndex = '+panelIndex);

    var nextPanel=panelCells[panelIndex];
    this.mouseDownPanel(nextPanel);
    this.mouseDownPanelCapturing(nextPanel);

    /*
    var cellPanel,panelCells=this.panelCells;
    for(var i=0;i<panelCells.length;i++){
      cellPanel=this.panelCells[i];
      Ispaces.logger.debug('cellPanel.panelIndex = '+cellPanel.panelIndex+', cellPanel.millis = '+cellPanel.millis);
    }

    panelCells.sort(Ispaces.Sorter.sortByMillis); // re-sort the apps by their last accessed milliseconds

    for(var i=0;i<panelCells.length;i++){
      cellPanel=this.panelCells[i];
      Ispaces.logger.debug('cellPanel.panelIndex = '+cellPanel.panelIndex+', cellPanel.millis = '+cellPanel.millis);
    }
    */

  }
  /*
   * End of keyboard event handling.
   */


  ,sortByMillis:function(a,b){
    //Ispaces.logger.debug(this.id+'.sortByMillis('+a+', '+b+')');
    a=a.millis,b=b.millis;
    //Ispaces.logger.debug('a = '+a+', b = '+b);
    return (a>b?-1:a<b?1:0);
  }


  /*
   * Context Menus
   */
  /*
  ,createContextMenus:function(){
    //Ispaces.logger.debug(this.id+'.createContextMenus()');

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
        //,oc:this.closePanel.bind(this,this.cellPanel)
        ,oc:this.closePanel.bind(this,this.cellPanel)
      }
    ];

    this.newFolderContextMenu=new Ispaces.ContextMenu(this,newFolderContextMenuJson);

    //this.createContextMenu();
  //}

  //,createContextMenu:function(){
    //Ispaces.logger.debug(this.id+'.createContextMenu()');

    //var _this=this;
    //var IMAGES=Constants.Paths.IMAGES;

    var fileContextMenuJson=[
      {
        tx:'Open'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.open(e)} // The "e" here is replaced by the event that launched the context menu so we can capture intended source of the event.
        ,oc:this.open.bind(this)
      }
      //,{
      //  tx:'Play'
      //  ,img:IMAGES+'test/folder_add.png'
      //  //,oc:function(e){_this.rename(e);Common.stopEventPropagation(e);Common.preventDefaultEvent(e);return false;}
      //  //,oc:function(e){_this.rename(e)}
      //  ,oc:this.play.bind(this)
      //  //,oc:function(e){_this.rename(e)}
      //}
      ,{
        tx:'Rename'
        ,img:IMAGES+'test/folder_add.png'
        //,oc:function(e){_this.rename(e);Common.stopEventPropagation(e);Common.preventDefaultEvent(e);return false;}
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

    this.fileContextMenu=new Ispaces.ContextMenu(this,fileContextMenuJson);
    //this.contextMenu=new ContextMenu(this,this.contextMenuJson);

    //var _this=this;
    //if(Constants.isOpera){ // Opera does not support the right click. We can use the left click plus CTRL key.
    //  this.desktop.oc(function(e){if(e.ctrlKey){_this.showContextMenu(e);Common.stopEventPropagation(e);return false}});
    //}else{
    //  this.desktop.cm(function(e){_this.showContextMenu(e);Common.stopEventPropagation(e);return false});
    //}
  }
  */

  /*
  ,showFileContextMenu:function(e){
    Ispaces.logger.debug(this.id+'.showFileContextMenu('+e+')');

    this.fileContextMenu.show(e);
    Common.killEvent(e);
    return false;
  }

  ,showPanelContextMenu:function(e){
    Ispaces.logger.debug(this.id+'.showPanelContextMenu('+e+')');
    this.newFolderContextMenu.show(e);
    Common.killEvent(e);
    return false;
  }
  */

  /**
   * Since the currentTarget is transient and temporary (and becomes null). Set a reference to it on the event object so it is available futher down the stack.
   * If the context menu event is for a file, isDir and fileName will be available on the targetElement.
   */
  ,showContextMenu:function(menuId,e){
    Ispaces.logger.debug(this.id+'.showContextMenu("'+menuId+'", '+e+')');

    e.targetElement=e.currentTarget; // Since the currentTarget is transient and temporary (and becomes null). Set a reference to it on the event object so it is available futher down the stack.

    Ispaces.logger.debug('e.targetElement.isDir = '+e.targetElement.isDir);
    Ispaces.logger.debug('e.targetElement.fileName = '+e.targetElement.fileName);

    /*
     * Prevent the right-click from activating the built-in browser context menu.
     * Stop the contextmenu event from propogating to the taskbar contextmenu handler.
     */
    //Common.preventDefaultEvent(e); // Prevent the right-click from activating the browser context menu.
    //Common.stopEventPropagation(e); // Stop the contextmenu event from propogating to the taskbar contextmenu handler.
    Common.killEvent(e);

    /*
     * A waterfall approach to showing the context menu.
     */
    if(!this.contextMenus[menuId]){

      if(!Ispaces.ContextMenu){
        Common.asyncRequired("ContextMenu",this.contextMenuLoaded.bind(this,menuId,e));
        return false;
      }

      this.contextMenuLoaded(menuId,e);
      return false;
    }

    this.contextMenus[menuId].show(e);
    return false;
  }

  ,contextMenuLoaded:function(menuId,e){
    Ispaces.logger.debug(this.id+'.contextMenuLoaded("'+menuId+'", e:'+e+')');

    this.createContextMenu(menuId,e);
  }

  ,createContextMenu:function(menuId,e){
    Ispaces.logger.debug(this.id+'.createContextMenu("'+menuId+'", '+e+')');

    var _this=this;

    var contextMenuItems=Ispaces.ContextMenus[menuId];

    if(!contextMenuItems){
      _this.getContextMenuItems(menuId,e);
      return;
    }

    _this.contextMenus[menuId]=new Ispaces.ContextMenu(_this,contextMenuItems);

    _this.contextMenus[menuId].show(e);
  }

  ,getContextMenuItems:function(menuId,e){
    Ispaces.logger.debug(this.id+'.getContextMenuItems("'+menuId+'", '+e+')');

    new Ispaces.Ajax(

      new Ispaces.StringBuilder([
        Ispaces.contextUrl
        ,'/context-menu/'
        ,menuId          // e.g. Desktop or DesktopFile or Folder etc
        //,FORWARDSLASH
        //,subMenuId // e.g. File
      ]).asString()

      ,this.callbackContextMenuItems.bind(this,menuId,e)

    ).doGet();
  }

  ,callbackContextMenuItems:function(menuId,e,r){
    Ispaces.logger.debug(this.id+'.callbackContextMenuItems("'+menuId+'", e:'+e+', r:'+r+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    var contextMenuItems=Ispaces.ContextMenus[menuId]=eval(Common.parens(r)); // Set a static reference to 'Ispaces.Desktop.contextMenuItems'.

    //Ispaces.logger.debug('contextMenuItems = '+contextMenuItems);
    //Ispaces.logger.debug('contextMenuItems.length = '+contextMenuItems.length);

    this.contextMenus[menuId]=new Ispaces.ContextMenu(this,contextMenuItems);
    //Ispaces.logger.debug('this.contextMenus['+menuId+'] = '+this.contextMenus[menuId]);

    this.contextMenus[menuId].show(e);
  }

  ,open:function(e){
    Ispaces.logger.debug(this.id+'.open('+e+')');

    //Ispaces.logger.debug('e.currentTarget = '+e.currentTarget);
    //Ispaces.logger.debug('e.targetElement = '+e.targetElement);
    //Ispaces.logger.debug('e[\'target\'] = '+e['target']);

    //Ispaces.logger.debug('e.fileName = '+e.fileName);
    //Ispaces.logger.debug('e.filePath = '+e.filePath);
    //var tr=e.o,fileName=e.o.fileName,filePath=e.o.filePath;
    //Ispaces.logger.debug('fileName = "'+fileName+'", filePath = "'+filePath+'"');

    //Ispaces.logger.debug(this.id+'.open(e): e.targetElement = '+e.targetElement);
    //Ispaces.logger.debug(this.id+'.open(e): e["target"] = '+e['target']);
    //e['target'].app.destroy();
    //Ispaces.Launcher.launchFileName(e.filePath);
    //Ispaces.Launcher.launchFileName(e.o,e);

    //Ispaces.Launcher.launchFileName(e.o,e);
    //Ispaces.Launcher.launchFileName(e.currentTarget,e);
    Ispaces.Launcher.launchFileName(e.targetElement,e);
  }

  /*
  ,play:function(e){
    Ispaces.logger.debug(this.id+'.play('+e+')');

    //Ispaces.logger.debug('e.currentTarget = '+e.currentTarget);
    //Ispaces.logger.debug('e.targetElement = '+e.targetElement);
    //Ispaces.logger.debug('e[\'target\'] = '+e['target']);

    var el=e.targetElement;
    Ispaces.logger.debug('el = '+el);
    var filePath=el.filePath;
    Ispaces.logger.debug('filePath = '+filePath);

    Ispaces.Sounds.playUrl(filePath);
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
    Ispaces.logger.debug(this.id+'.rename('+e+')');

    var _this=this // _this.restoreFileName
    ,fileElement=e.targetElement
    ,isLocal=fileElement.isLocal
    ,div=fileElement.div
    ,textNode=div.firstChild
    ,FORWARDSLASH=_this.Constants.FORWARDSLASH
    ,fileName=fileElement.fileName
    ,length=fileName.length
    ,sourceFilePath=fileElement.filePath;
    ;

    //Ispaces.logger.debug('fileElement = '+fileElement);
    //Ispaces.logger.debug('isLocal = '+isLocal);
    //Ispaces.logger.debug('div = '+div);
    //Ispaces.logger.debug('textNode = '+textNode);
    //Ispaces.logger.debug('fileName = '+fileName);
    //Ispaces.logger.debug('length = '+length);
    //Ispaces.logger.debug('sourceFilePath = '+sourceFilePath);

    this.removeKeyListeners();

    div.setClass("outline");

    //div.contentEditable=true; // 'contentEditable' is getting obfuscated
    div['contentEditable']=true;
    //div.setAttribute('contenteditable','true');

    // turn off spellcheck
    //div.spellcheck=false;
    //div.setAttribute('spellcheck','false');
    //Ispaces.logger.debug('(\'spellcheck\' in body) = '+('spellcheck' in body));
    //body.setAttribute('spellcheck','false');
    if('spellcheck' in body){
      body.spellcheck=false;
    }

    div.addListener(

      Constants.Events.KEYDOWN

      ,div.keyDown=function(e){
        Ispaces.logger.debug('div.keyDown('+(e.which||e.keyCode)+')');

        //e.preventDefault();

        var key=e.which||e.keyCode;
        //Ispaces.logger.debug('key = '+key);

        switch(key){

          case 8: Ispaces.logger.debug('DELETE');

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
              Ispaces.logger.debug('newName = "'+newName+'"');
              var newLength=newName.length;
              Ispaces.logger.debug('newLength = '+newLength);

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
              //Ispaces.logger.debug('div.keyEvent('+e+'): return false;');
              //return false;
              //Ispaces.logger.debug('div.keyEvent('+e+'): return true;');
              //return true;

            }
            break;

          case 13: // Ispaces.logger.debug('RETURN/ENTER');

            var newName=textNode.data;

            //Ispaces.logger.debug('fileName = "'+fileName+'"');
            //Ispaces.logger.debug('newName = "'+newName+'"');

            if(newName!=fileName){ // only update if the fileName has changed

              var lastIndexOfFileSeparator=sourceFilePath.lastIndexOf(FORWARDSLASH);
              var path=sourceFilePath.substring(0,lastIndexOfFileSeparator+1);
              var targetFilePath=new Ispaces.StringBuilder([path,newName]).asString();

              //Ispaces.logger.debug('lastIndexOfFileSeparator = '+lastIndexOfFileSeparator);
              //Ispaces.logger.debug('path = '+path);
              //Ispaces.logger.debug('targetFilePath = '+targetFilePath);

              if(isLocal){

                //var renamed=Ispaces.Files.renameFile({f:sourceFilePath,t:targetFilePath});
                //var renamed=Ispaces.Files.renameFile(sourceFilePath,targetFilePath);
                var renamed=Ispaces.Files.renameFile(
                  sourceFilePath
                  ,targetFilePath
                );

                //Ispaces.logger.debug('renamed = '+renamed);

                if(renamed){ // The rename was successful.

                  fileElement.fileName=newName;
                  fileElement.filePath=targetFilePath;
                  fileElement.div.filePath=targetFilePath;

                  var from=[
                    fileName
                    ,sourceFilePath
                  ];

                  var to=[
                    newName
                    ,targetFilePath
                  ];

                  //Ispaces.Files.rename(from,to); // not required for local files.

                  div.setClass("selected");
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

                  div.setClass("selected");
                  div['contentEditable']=false;
                  div.removeListener(Constants.Events.KEYDOWN,this.keyDown);
                  div.blur();
                  body.spellcheck=true; // Re-enable the spellcheck.
                }

              }else{

                new Ispaces.Ajax(

                  Ispaces.contextUrl+"/move"

                  ,function(r){
                    Ispaces.logger.debug('callback("'+r+'")');

                    if(parseInt(r)){ // The rename was successful.

                      //_this.restoreFileNameDiv(el,newName);
                      fileElement.fileName=newName;
                      fileElement.filePath=targetFilePath;

                      //Ispaces.logger.debug('fileElement.fileName="'+fileElement.fileName+'"');
                      //Ispaces.logger.debug('fileElement.filePath="'+fileElement.filePath+'"');
                      //Ispaces.logger.debug('el.fileStem="'+el.fileStem+'"');

                      //el.cellTitlebar.replaceFirst(this.create.createTextNode(newName));
                      //cellTitlebar.replaceFirst(this.create.createTextNode(newName));

                      //var fileMap=Ispaces.Files.rename(sourceFilePath,targetFilePath);

                      var from=[
                        fileName
                        ,sourceFilePath
                      ];

                      var to=[
                        newName
                        ,targetFilePath
                      ];

                      //var fileMap=Ispaces.Files.rename(from,to);
                      Ispaces.Files.rename(from,to);

                      //var fileUnorderedList=this.createFileUnorderedList(tableRow.root,parentNameAndPath[1],fileMap,this.divFiles); // Create the new file table.
                      //this.divFiles.replaceFirst(fileUnorderedList); // Replace the old file table with the new one.
                      //this.mouseDownTableRow(null,fileUnorderedList.firstChild,this.divFiles); // Simulate the mouse down on the first row, to select it.
                      ////this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.

                      //_this.restoreFileNameDiv(el,el.fileName);

                      // TBD. If the file being renamed is on the desktop, we have to change it there too.
                      //Ispaces.spaces.getSpace().desktop.files[newName]=Ispaces.spaces.getSpace().desktop.files[fileName];
                      //delete Ispaces.spaces.getSpace().desktop.files[fileName];
                      //var filesString=JSON.stringify(Ispaces.spaces.getSpace().desktop.files);
                      ////Ispaces.logger.alert(Ispaces.spaces.getSpace().desktop.id+'.rename("'+e+'"): filesString = '+filesString);
                      //var sb=new Ispaces.StringBuilder();
                      //sb.appendAll(["this.resetPositions(",filesString,RIGHTPAREN]);
                      ////Ispaces.logger.alert('tableRow.draggableElement.moved('+xy+'): sb.asString() = '+sb.asString());
                      ////Ispaces.logger.alert('tableRow.draggableElement.moved('+xy+'): Ispaces.spaces.getSpace().store.reset('+_this.id+','+sb.asString()+')');
                      //Ispaces.spaces.getSpace().store.reset(Ispaces.spaces.getSpace().desktop.id,sb.asString());

                      div.removeListener(Constants.Events.KEYDOWN,div.keyDown);

                      div.setClass("selected");
                      div['contentEditable']=false;
                      div.removeListener(Constants.Events.KEYDOWN,this.keyDown);
                      div.blur();
                      body.spellcheck=true; // Re-enable the spellcheck.

                      Ispaces.logger.warn(this.id+'.rename('+e+'): We should only refresh the current desktop, and refresh other desktops when they are re-accessed.');
                      Ispaces.spaces.getSpace().desktop.refresh(); // Do we need the refresh the current desktop?

                      Ispaces.logger.warn(this.id+'.rename('+e+'): If a file manager has folder open that is modified by the rename, we have to update that FileManager.');
                      //var fileManagers=Ispaces.system.getApplications(_this.classId);
                      var fileManagers=Ispaces.spaces.getApplicationsOfClass(_this.classId);

                      //Ispaces.logger.debug('fileManagers = '+fileManagers);
                      //Ispaces.logger.debug('fileManagers.length = '+fileManagers.length);
                      //fileManagers.forEach(function(x){if(x!=fileManager)x.recreateRoots()});
                      fileManagers.forEach(function(fileManager){fileManager.refresh()});

                    } // if(parseInt(r))
                  } // callback

                //); // new Ispaces.Ajax()
                ).send({f:sourceFilePath,t:targetFilePath}); // new Ispaces.Ajax()
                //}).send({f:sourceFilePath,t:targetFilePath,'millis':Common.getMilliseconds()}); // new Ispaces.Ajax()

              } // if(isLocal)

            }else{ // if(newName!=fileName)

              div.removeListener(
                Constants.Events.KEYDOWN
                ,div.keyDown
              );

              this.setClass("selected");
              this['contentEditable']=false;
              this.removeListener(Constants.Events.KEYDOWN,this.keyDown);
              this.blur();
              //el.oc(el.onClick); // Remove the on click event while the file is being renamed.
              body.spellcheck=true; // Re-enable the spellcheck.

            } // if(newName!=fileName)

            //Ispaces.global.escapeKeyObject=null;
            //Ispaces.global.escapeObject=null;
            Common.setEscapeKeyObject(null);
            Common.setEscapeObject(null);

            _this.addKeyListeners(); // Re-add the key listeners after renaming.
            //*/

            //Common.preventDefaultEvent(e); // Prevent the return/enter key from taking the input to the next line.
            Common.killEvent(e); // Prevent the return/enter key from propogating to the next level.

            break;
            //return true;

          case 27: // Ispaces.logger.debug('ESCAPE');

            //Ispaces.logger.debug('fileName = '+fileName);

            div.removeListener(
              Constants.Events.KEYDOWN
              ,div.keyDown
            );

            //this.setClass('');
            this.setClass("selected");
            this['contentEditable']=false;
            //this.setAttribute('contenteditable','false');
            this.removeListener(Constants.Events.KEYDOWN,this.keyDown);
            this.blur();
            //el.oc(el.onClick); // Remove the on click event while the file is being renamed.

            //Ispaces.global.escapeKeyObject=null;
            //Ispaces.global.escapeObject=null;
            Common.setEscapeKeyObject(null);
            Common.setEscapeObject(null);

            //this.replaceFirst(this.Create.createTextNode(fileName));
            //this.replaceFirst(_this.Create.createTextNode('test'));
            //textNode.data='test';
            //new Ispaces.AsyncApply(_this,"restoreFileName",[textNode,fileName],10);
            //new Ispaces.AsyncApply(_this,"restoreFileNameDiv",[el,fileName],1000);
            //_this.restoreFileNameDiv(el,fileName);
            _this.restoreFileNameDiv(div,fileName);

            _this.addKeyListeners(); // Re-add the key listeners after renaming.

            //default:
            //return;

        } // switch(key)

        //Ispaces.logger.debug('div.keyDown('+e+'): return true;');
        //return true;
        //Ispaces.logger.debug('div.keyDown('+e+'): return false;');
        return false;
      }

      ,false
    );

    div.focus();

    var range=document.createRange(); // Create a range (a range is a like the selection but invisible).
    //Ispaces.logger.debug('range = ');
    //Ispaces.logger.object(range);

    //range.selectNode(el);
    //range.selectNode(div);
    //range.selectNode(el.firstChild);
    //range.selectNodeContents(el); // Select the entire contents of the element with the range
    //range.selectNodeContents(div); // Select the entire contents of the element with the range
    range.selectNodeContents(textNode); // Select the entire contents of the element with the range
    //range.collapse(false); // Collapse the range to the end point. false means collapse to end rather than the start

    //*
    var selection=window.getSelection(); // Get the selection object (allows you to change selection)
    //Ispaces.logger.debug('selection = ');
    //Ispaces.logger.object(selection);

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
      //Ispaces.logger.debug('el.escape()');
    div.escape=function(){
      Ispaces.logger.debug('div.escape()');
      //Ispaces.logger.debug('fileName = '+fileName);

      /*
      //this.replaceFirst(this.Create.createTextNode(fileName));
      _this.restoreFileNameDiv(this,fileName);
      */
      //this.setClass('');
      this.setClass("selected");
      this['contentEditable']=false;
      //this.setAttribute('contenteditable','false');
      this.removeListener(Constants.Events.KEYDOWN,this.keyDown);
      this.blur();

      _this.restoreFileNameDiv(div,fileName);

      //Ispaces.global.escapeKeyObject=null;
      //Ispaces.global.escapeObject=null;
      Common.setEscapeKeyObject(null);
      Common.setEscapeObject(null);
    };

    //Ispaces.global.escapeKeyObject=div;
    //Ispaces.global.escapeObject=div;
    Common.setEscapeKeyObject(div);
    Common.setEscapeObject(div);

    //el.selectionStart=10;
    //el.selectionEnd=10;
    //var textRange=body.createTextRange();
    //Ispaces.logger.object(textRange);
    //textRange.moveToElementText(el);
    //range.setEndPoint('EndToStart',textRange);
    //range.selectNodeContents(el);
    //range.setStart('character',0);
    //range.setEnd('character',10);
    //range.setStart(range.END_TO_START);
    //range.setStartAfter();
    /*
    var sel=this.getSelection(el);
    Ispaces.logger.debug('sel = '+sel);
    var range=sel.getRangeAt(0);
    Ispaces.logger.debug('range = '+range);
    Ispaces.logger.debug('Current position: '+range.startOffset+' inside '+range.startContainer);
    */
  }

  ,restoreFileNameDiv:function(div,fileName){
    Ispaces.logger.debug(this.classId+'.restoreFileNameDiv('+div+', "'+fileName+'")');
    //textNode.data=fileName;
    //div.data='test';
    //var parentNode=div.parentNode;
    //div.replaceFirst(this.Create.createTextNode('test0'));
    //div.rm();
    //parentNode.rmCs();
    div.rmCs();
    //parentNode.add(this.Create.createTextNode(fileName));
    div.add(this.Create.createTextNode(fileName));
  }

  ,restoreFileName:function(textNode,fileName){
    Ispaces.logger.debug(this.classId+'.restoreFileName('+textNode+', '+fileName+')');
    //textNode.data=fileName;
    textNode.data='test';
  }

  // TBD
  //,okRename:function(sourceFilePath,targetFilePath){
  //  Ispaces.logger.debug(this.id+'.okRename(sourceFilePath:"'+sourceFilePath+'", targetFilePath:"'+targetFilePath+'")');
  //}






  /*
   * Show, Hide, Maximize, Minimize, Restore, Snap
   */

  /*
  ,show:function(){
    Ispaces.logger.debug(this.id+'.show()');

    Ispaces.logger.debug('this.minimized = '+this.minimized);
    Ispaces.logger.debug('this.resizableWindow.minimized = '+this.resizableWindow.minimized);

    this.divApplicationWindow.show();
  }

  ,hide:function(){
    Ispaces.logger.debug(this.id+'.hide()');

    Ispaces.logger.debug('this.minimized = '+this.minimized);
    Ispaces.logger.debug('this.resizableWindow.minimized = '+this.resizableWindow.minimized);

    this.divApplicationWindow.hide();
  }

  ,minimize:function(){
    Ispaces.logger.debug(this.id+'.minimize()');

    Ispaces.logger.debug('this.isTop = '+this.isTop);

    this.minimized=true;

    //this.resizableWindow.minimize();

    //if(!this.resizableWindow.minimized){ // If the window is minimized, do nothing.
    //  //escape();
    //  //this.resizableWindow.invisible();
    //}
    this.divApplicationWindow.hide();

  }

  ,unMinimize:function(){
    Ispaces.logger.debug(this.id+'.unMinimize()');

    Ispaces.logger.debug('this.isTop = '+this.isTop);

    this.minimized=false;

    //this.resizableWindow.unMinimize();
    //this.resizableWindow.hide();
    this.divApplicationWindow.show();


    //this.show();
    //this.visible();
    //this.toFrontApplications();

    //this.windowControl.minimized=false;
  }
  */

  ,maximize:function(){
    Ispaces.logger.debug(this.id+'.maximize()');

    /*
     * At this point the divApplication is already maximized, so we cannot measure the divApplication width here.
     * The adDiv width is now measured in the function setDimensions().
     */
    /*
    this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication);
    Ispaces.logger.debug(this.id+'.maximize(): this.divApplication.widthHeight = '+this.divApplication.widthHeight);
    Ispaces.logger.alert(this.id+'.maximize(): this.divApplication.widthHeight = '+this.divApplication.widthHeight);
    */

    /*
     * At this point the divMain is NOT maximized, although it is already measured in setDimensions().
     *
    this.divMain.widthHeight=Common.getWidthHeight(this.divMain);
    Ispaces.logger.debug(this.id+'.maximize(): this.divMain.widthHeight = '+this.divMain.widthHeight);
    Ispaces.logger.alert(this.id+'.maximize(): this.divMain.widthHeight = '+this.divMain.widthHeight);
     */

    var panelCount=this.panelCells.length;
    //Ispaces.logger.debug('panelCount = '+panelCount);
    this.panelCount=panelCount;

    //* this.divMain
    //Ispaces.logger.alert(this.id+'.maximize(): this.divMain.setBorder('+Constants.Borders.GREEN+')');
    //this.divMain.setBorder(Constants.Borders.GREEN);
    //this.divMain.setBorder('green 5px solid');
    //Ispaces.logger.alert(this.id+'.maximize(): this.divMain.setWidthHeightPercent(100)');
    this.divMain.setWidthHeightPercent(100);
    //*/

    //* this.divTable
    //this.divTable.setBorder(Constants.Borders.BLUE);
    //Ispaces.logger.alert(this.id+'.maximize(e): this.divTable.setBorder(\'blue 5px solid\')');
    //this.divTable.setBorder('blue 5px solid');
    //this.divTable.setBorder(Constants.Borders.BLUE);
    //Ispaces.logger.alert(this.id+'.maximize(e): this.divTable.setWidthHeightPercent(100)');
    //this.divTable.setWidthHeightPercent(100);
    //Ispaces.logger.alert(this.id+'.maximize(e): this.divTable.di(\'block\')');
    //this.divTable.di('block');
    //*/


    //* this.divApplication
    //Ispaces.logger.alert(this.id+'.maximize(): this.divApplication.setBorder(\'black 5px solid\')');
    //this.divApplication.setBorder('black 5px solid');
    //Ispaces.logger.alert(this.id+'.maximize(): this.divApplication.setBorder('+Constants.Borders.BLACK+')');
    //this.divApplication.setBorder(Constants.Borders.BLACK);
    //Ispaces.logger.alert(this.id+'.maximize(): this.divApplication.setWidthHeightPercent(100)');
    this.divApplication.setWidthHeightPercent(100);
    //Ispaces.logger.alert(this.id+'.maximize(): this.divApplication.di(\'block\')');
    //this.divApplication.di('block');
    //*/

    //Ispaces.logger.debug('Common.getWidthHeight(this.divMain) = '+Common.getWidthHeight(this.divMain));
    //Ispaces.logger.debug('Common.getWidthHeight(this.divApplication) = '+Common.getWidthHeight(this.divApplication));
    //Ispaces.logger.debug('Common.getWidthHeight(this.divApplicationWindow) = '+Common.getWidthHeight(this.divApplicationWindow));

    var divApplicationWidthHeight=Common.getWidthHeight(this.divApplication);
    //var newWidth=Common.getWidth(this.divApplication);
    //Ispaces.logger.debug('divApplicationWidthHeight = '+divApplicationWidthHeight);

    //this.resetPanels();
    //this.adjustPanels(newWidth);
    this.setWidthPixels(divApplicationWidthHeight[0]);
    this.setHeightPixels(divApplicationWidthHeight[1]);

    /*
    var padHeight=Ispaces.ui.taskbar.widthHeight[1];
    Ispaces.logger.debug(this.id+'.createAp(): padHeight = '+padHeight);

    //Ispaces.logger.alert(this.id+".maximize(): this.padRow.di("+Constants.Properties.TABLEROW+")");
    //this.padRow.di(Constants.Properties.TABLEROW);
    this.resizableWindow.s.setClass('s8');
    this.resizableWindow.s.di('block');
    this.resizableWindow.s.setHeightPixels(padHeight);
    this.resizableWindow.s.setMinHeight(padHeight);
    */

    /*
    this.padRow.setHeightPixels(padHeight);
    this.padRow.setMinHeight(padHeight);
    this.padRow.divPad.setHeightPixels(padHeight);
    this.padRow.divPad.setMinHeight(padHeight);
    //*/

    //this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
  }

  ,restore:function(){
    Ispaces.logger.debug(this.id+'.restore()');

    var applicationWidth=this.divApplication.widthHeight[0];
    //Ispaces.logger.debug(this.id+'.restore(): applicationWidth = '+applicationWidth);

    var divApplicationWidthHeight=this.divApplication.widthHeight;
    //Ispaces.logger.debug(this.id+'.restore(): divApplicationWidthHeight = '+divApplicationWidthHeight);

    //this.resizableWindow.pad(3); // Reset the window padding.

    // Reset the divMain width/height.
    //this.divMain.setWidthHeightPixels(this.divMain.widthHeight[0],this.divMain.widthHeight[1]); // Shift the divMain back into its original dimensions,
    //Common.unsetWidthHeight(this.divMain); // then, unset the width/height setting.

    //Ispaces.logger.alert(this.id+'.restore(): Common.unsetWidthHeight(this.divTable)');
    //Common.unsetWidthHeight(this.divTable); // If the divTable is not the same element as divMain, we have to unset it as well.

    /*
    // Reset the leftDiv and rightDiv width/height.
    Ispaces.logger.debug(this.id+'.restore(): if(this.leftDiv.widthHeight)this.leftDiv.setHeightPixels('+this.leftDiv.widthHeight[1]+')');
    //if(this.leftDiv.widthHeight)this.leftDiv.setHeightPixels(this.leftDiv.widthHeight[1]);
    //if(this.rightDiv.widthHeight)this.rightDiv.setHeightPixels(this.rightDiv.widthHeight[1]);
    if(this.leftDiv.widthHeight)this.leftDiv.setWidthHeightPixels(this.leftDiv.widthHeight[0],this.leftDiv.widthHeight[1]);
    if(this.rightDiv.widthHeight)this.rightDiv.setWidthHeightPixels(this.rightDiv.widthHeight[0],this.rightDiv.widthHeight[1]);
    //Common.unsetWidthHeight(this.leftDiv);
    //Common.unsetWidthHeight(this.rightDiv);
    //Ispaces.logger.alert(this.id+'.restore(): Common.unsetH(this.leftDiv)');
    //Common.unsetH(this.leftDiv);
    //Common.unsetH(this.rightDiv);
    Common.unsetH(this.leftDiv);
    Common.unsetH(this.rightDiv);

    // Reset the leftDivFiles and rightDivFiles height only.
    //this.leftDivFiles.setWidthHeightPixels(this.leftDivFiles.widthHeight[0],this.leftDivFiles.widthHeight[1]);
    //this.rightDivFiles.setWidthHeightPixels(this.rightDivFiles.widthHeight[0],this.rightDivFiles.widthHeight[1]);
    this.leftDivFiles.setHeightPixels(this.leftDivFiles.widthHeight[1]);
    this.rightDivFiles.setHeightPixels(this.rightDivFiles.widthHeight[1]);
    */

    //this.padRow.di(Constants.Properties.NONE);
    //Common.unsetH(this.resizableWindow.s);
    //this.resizableWindow.s.setHeightPixels(8);
    //this.resizableWindow.s.setMinHeight(8);
    //this.resizableWindow.s.setHeightPixels('');
    //this.resizableWindow.s.setMinHeight('');
    //this.resizableWindow.s.setHeightPixels('none');
    //this.resizableWindow.s.setMinHeight('none');
    //this.resizableWindow.s.setClass('s8');
    //this.resizableWindow.s.setHeightPixels(padHeight);
    //this.resizableWindow.s.setMinHeight(padHeight);

    //this.restorePanels();
    var panelCount=this.panelCells.length;
    //Ispaces.logger.debug('panelCount = '+panelCount);

    //Ispaces.logger.debug('(panelCount!=this.panelCount) = '+(panelCount!=this.panelCount));

    /*
    if(panelCount!=this.panelCount){

      //this.adjustPanel();
      //var divMainWidth=this.divMain.widthHeight[0];
      //this.setWidthPixels(divMainWidth);
      //this.adjustPanelWidthsPercent(divMainWidth);
      //this.adjustPanels(divMainWidth);

      //var totalWidth=divMainWidth;
      var totalWidth=this.divMain.w;
      Ispaces.logger.debug('totalWidth = '+totalWidth);

      var cellPanel
      ,panelCells=this.panelCells
      ,cellFiles
      ,i
      ,z=panelCells.length
      ,w
      ,h=this.cellFilesH
      ;

      for(i=0;i<z;i++){

        cellPanel=panelCells[i]
        ,cellFiles=cellPanel.cellFiles
        //,cellFilesWidthHeight=cellFiles.widthHeight
        ,cellFilesWidthHeight=this.cellFilesH
        ;

        w=totalWidth/z;
        Ispaces.logger.debug('w = '+w);
        cellPanel.setWidthPixels(w),cellPanel.setMaxWidth(w); // set the panel width
        cellPanel.w=w;
        //cellFiles.setWidthPixels((cellPanel.w-7));               // set the cellFiles width for overflow hidden
        //cellFiles.setWidthHeightPixels((cellPanel.w-7),cellFilesWidthHeight[1]);               // set the cellFiles width for overflow hidden
        cellFiles.setWidthHeightPixels((cellPanel.w-7),h);               // set the cellFiles width for overflow hidden
      }

    }else{

      //this.restorePanels();

      //this.adjustPanels(applicationWidth); // the restored width
      this.setWidthPixels(divApplicationWidthHeight[0]); // the restored width
      this.setHeightPixels(divApplicationWidthHeight[1]); // the restored height
    }
    */
    this.setWidthPixels(divApplicationWidthHeight[0]); // the restored width
    this.setHeightPixels(divApplicationWidthHeight[1]); // the restored height

    //this.draggableAp.addMouseDown(); // Re-add the ability to drag the window.
  }

/*
  ,snapTopLeft:function(){
    //Ispaces.logger.alert(this.id+'.snapTopLeft()');

    this.divApplication.widthHeight=Common.getWidthHeight(this.divApplication); // Save the divApplication width/height for restore.
    this.divMain.widthHeight=Common.getWidthHeight(this.divMain); // Save the divMain width/height for restore.
    //Ispaces.logger.debug(this.id+'.snapTopLeft(): this.divApplication.widthHeight[0]='+this.divApplication.widthHeight[0]+', this.divApplication.widthHeight[1]='+this.divApplication.widthHeight[1]);

    Common.unsetWidthHeight0(this.leftDiv);
    Common.unsetWidthHeight0(this.rightDiv);
    Common.unsetH0(this.leftDivFiles);
    Common.unsetH0(this.rightDivFiles);

    //Ispaces.logger.alert(this.id+'.snapTopLeft(): this.divApplication.setBorder(Constants.Borders.YELLOW)');
    //this.divApplication.setBorder(Constants.Borders.YELLOW);

    //Ispaces.logger.alert(this.id+'.snapTopLeft(): this.divApplication.setWidthHeightPercent(100)');
    this.divApplication.setWidthHeightPercent(100);

    //Ispaces.logger.alert(this.id+'.snapTopLeft(): this.divMain.setWidthHeightPercent(100)');
    this.divMain.setWidthHeightPercent(100);

    //this.draggableAp.removeMouseDown(); // Remove the ability to drag the window.
  }

  ,calculateHeight:function(){
    Ispaces.logger.debug(this.id+'.calculateHeight()');

    var h=viewableWidthHeight[1];
    h-=this.resizableWindow.titlebar.widthHeight[1]; // Subtract the titlebar.
    if(this.bottomMenu)h-=this.bottomMenu.widthHeight[1]; // Subtract the bottom menu.
    //if(this.tabMenu)h-=this.tabMenu.widthHeight[1]; // Subtract the tab menu.
    //h-=3; // Back the bottom off a little???
    //Ispaces.logger.alert(this.id+'.calculateHeight(): h='+h);

    return {w:viewableWidthHeight[0],h:h};
  }
*/

  /*
  ,destroySave:function(e){
    Ispaces.logger.debug(this.id+'.destroySave('+e+')');
    this.resizableWindow.invisible(); // First off hide the window. Calls ResizableWindow.divApplicationWindow.invisible().
    //if(e)Common.stopEventPropagation(e);
    AsyncApply.exec(new Ispaces.AsyncApply(this,"destroy",null,50));
  }

  ,destroy:function(){
    Ispaces.logger.debug(this.id+'.destroy()');

    this.removeKeyListeners();    // Remove any event handlers from this app.
    //this.blur();
    this.resizableWindow.destroyWindow();
    Ispaces.spaces.getSpace().removeApplication(this);
    Ispaces.spaces.getSpace().store.remove(this.id);

    for(var p in this){
      this[p]=null;
      delete this[p];
    }
  }

  ,xyz:function(x,y,z){
    Ispaces.logger.debug(this.id+'.xyz('+x+','+y+','+z+')');
    this.resizableWindow.divApplication.xyz(x,y,z);
  }
  */
  /*
   * End of Show, Hide, Maximize, Minimize, Restore, Snap
   */


  /*
   * Resizing
   */
  /*
   * Set the starting width and measure each of the panelCells.
   * @see adjustPanels()
   * NOTE: We are not allowing for the center grabbers when calculating the percent width of the panelCells.
   */
  ,resizingStarted:function(w){
    Ispaces.logger.debug(this.id+".resizingStarted("+w+")");

    this.adjustPanelWidthsPercent(w);
    this.getFileCellsHeights();
  }

  ,resizingStopped:function(){
    Ispaces.logger.debug(this.id+'.resizingStopped()');

  //  this.widthHeight=Common.getWidthHeight(this.divMain);
    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }

  /*
  ,draggingStarted:function(){
    //Ispaces.logger.debug(this.id+'.draggingStarted()');
  }
  */

  ,draggingStopped:function(){
    Ispaces.logger.debug(this.id+'.draggingStopped()');

    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }

  /**
   * for dnd
   * Reset positions after:
   *   1) Reordering panels.
   *   2) Dragging the window.
   *   3) Opening Folders
   *   4) Selecting a new root.
   *   5) Flat view replacement.
   *   6) Closing a panel
   */
  ,resetPositions:function(){
    Ispaces.logger.debug(this.id+'.resetPositions()');

    this.resetPanelPositions();

    //this.resetFolderPositions(); // Temporarily removed.
  }

  ,resetPanelPositions:function(){
    Ispaces.logger.debug(this.id+'.resetPanelPositions()');

    this.panelCells.forEach(function(cellPanel){

      cellPanel._xy=Common.getXY(cellPanel);
      cellPanel.widthHeight=Common.getWidthHeight(cellPanel);

      //Ispaces.logger.debug('cellPanel._xy = '+cellPanel._xy);
      //Ispaces.logger.debug('cellPanel.widthHeight = '+cellPanel.widthHeight);

      /*
      var dropFolders=cellPanel.dropFolders;
      if(dropFolders){
        Ispaces.logger.debug(this.id+'.resetPanelPositions(): dropFolders = '+dropFolders.length);

        dropFolders.forEach(function(folder){

          folder._xy=Common.getXY(folder);
          folder.widthHeight=Common.getWidthHeight(folder);  // No need to set the width/height on reposition.

          //Ispaces.logger.debug('folder._xy = '+folder._xy);
          //Ispaces.logger.debug('folder.widthHeight = '+folder.widthHeight);
        });
      }
      */

      if(cellPanel.dropFolders){

        //Ispaces.logger.debug('cellPanel.dropFolders.length = '+cellPanel.dropFolders.length);

        cellPanel.dropFolders.forEach(function(dropFolder){
          dropFolder._xy=Common.getXY(dropFolder)
          ,dropFolder.widthHeight=Common.getWidthHeight(dropFolder)
          ;
        });
      }

    });
  }

  /*
  ,resetFolderPositions:function(){
    Ispaces.logger.debug(this.id+'.resetFolderPositions()');

    Ispaces.logger.debug('this.dropFolders.length = '+this.dropFolders.length);

    this.dropFolders.forEach(function(folder){
      folder._xy=Common.getXY(folder);
      folder.widthHeight=Common.getWidthHeight(folder);
      //Ispaces.logger.debug('folder._xy = '+folder._xy);
      //Ispaces.logger.debug('folder.widthHeight = '+folder.widthHeight);
    });
  }
  */

  ,setWidthPixels:function(w){
    //Ispaces.logger.debug(this.id+'.setWidthPixels('+w+')');

    //this.divMain.setWidthPixels(w);
    //this.divTable.setWidthPixels(w);
    //this.divTable.setWidthPixels(w);

    this.adjustPanels(w);

    this.divApplication.setWidthPixels(w);
  }

  ,setHeightPixels:function(h){
    //Ispaces.logger.debug(this.id+'.setHeightPixels('+h+')');

    /*
    var dimensions=this.dimensions;
      titlebarWidthHeight:titlebarWidthHeight
      ,tabsMenuWidthHeight:tabsMenuWidthHeight
      ,navMenuWidthHeight:navMenuWidthHeight
    };
    var barHeights=(titlebarWidthHeight[1]+navMenuWidthHeight[1]+tabsMenuWidthHeight[1]);
    Ispaces.logger.debug('barHeights = '+barHeights);
    */

    var scrollHeight=h;

    scrollHeight-=33; // Subtract 33 for the window titlebar.
    scrollHeight-=33; // Subtract 33 for the bottom menu.

    if(scrollHeight>=0)this.divMain.setHeightPixels(scrollHeight);

    scrollHeight-=33; // Subtract 33 for the topbar.

    this.setFileCellsHeights(scrollHeight); // temporary, this should be calculated.

    this.divApplication.setHeightPixels(h);

    /*
    this.barHeights=66; // temporary, this should be calculated

    var divMainH=h-this.barHeights;
    //Ispaces.logger.debug('divMainH = '+divMainH);
    if(divMainH>=0){
      //Ispaces.logger.debug('this.divMain.setHeightPixels('+divMainH+')');
      this.divMain.setHeightPixels(divMainH);
    }

    divMainH-=33; // Subtract 33 for the topbar.
    divMainH-=33; // Subtract 33 for the bottom menu.

    this.setFileCellsHeights(divMainH); // temporary, this should be calculated.

    this.divApplication.setHeightPixels(h);
    //*/
  }

  ,getFileCellsHeights:function(){
    //Ispaces.logger.debug(this.id+'.getFileCellsHeights()');

    this.height=Common.getHeight(this.divMain);
    //Ispaces.logger.debug('this.height = '+this.height);

    var cellFiles
    ,cellFilesHeight
    ;

    this.panelCells.forEach(function(cellPanel){

      cellFiles=cellPanel.cellFiles
      ,cellFiles._height=Common.getHeight(cellFiles)
      ;

      //Ispaces.logger.debug('cellFiles._height = '+cellFiles._height);
    });
  }

  ,setFileCellsHeights:function(h){
    //Ispaces.logger.debug(this.id+'.setFileCellsHeights('+h+')');

    /*
    var panelCells=this.panelCells
    ,i
    ,panelCellsLength=panelCells.length
    ,cellPanel
    ,cellFiles
    ,isTree
    ;

    for(i=0;i<panelCellsLength;i++){

      cellPanel=panelCells[i]
      ,cellFiles=cellPanel.cellFiles
      ,isTree=cellPanel.isTree
      ;

      //Ispaces.logger.debug('isTree = '+isTree);

      //Ispaces.logger.debug('cellFiles.setHeightPixels('+h+')');
      //cellFiles.setHeightPixels(h);
      //cellFiles.di(Constants.Properties.BLOCK);

      if(isTree){
        cellFiles.setHeightPixels(h);
        cellFiles.setDisplay(Constants.Properties.BLOCK);
      }else{
        if(cellPanel.tbody){
          //Ispaces.logger.debug('cellPanel.tbody.setHeightPixels('+(h-24)+')');
          cellPanel.tbody.setHeightPixels(h-24);
          //cellPanel.tbody.setOverflow('scroll');
          //cellPanel.tbody.di('block');
        }
      }

    }
    */

    var cellFiles
    ,tbody
    ,unorderedList
    ;

    this.panelCells.forEach(function(cellPanel){

      cellFiles=cellPanel.cellFiles
      ,tbody=cellPanel.tbody
      ,unorderedList=cellPanel.unorderedList
      //,isTree=cellPanel.isTree
      ;

      //Ispaces.logger.debug('cellFiles = '+cellFiles);
      //Ispaces.logger.debug('unorderedList = '+unorderedList);

      //cellPanel.setWidthPixels(newWidth),cellPanel.setMaxWidth(newWidth),cellPanel.setMinWidth(newWidth); // maWi() allows the overflow to work.
      //cellPanel.setWidthPixels(newWidth),cellPanel.setMaxWidth(newWidth); // maWi() allows the overflow to work.
      //cellPanel.fixedWidth(newWidth); // maWi() allows the overflow to work.

      //if(cellFiles)cellFiles.fixedHeight(h);
      //if(cellFiles)cellFiles.setOverflow(Constants.Properties.SCROLL);
      //if(cellFiles)cellFiles.setHeightPixels(h);
      if(cellFiles){
        //Ispaces.logger.debug(this.id+'.setFileCellsHeights('+h+'): cellFiles.setHeightPixels('+h+')');
        //cellFiles.setHeightPixels(h);
        //Ispaces.logger.debug('divFiles.fixedHeight('+h+')');
        //Ispaces.logger.debug('cellFiles.fixedHeight('+h+')');
        cellFiles.fixedHeight(h);
        //Ispaces.logger.debug('cellFiles.setHeightPixels('+h+'),cellFiles.setMaxHeight('+h+')');
        //cellFiles.setHeightPixels(h),cellFiles.setMaxHeight(h);
        //cellFiles.setOverflow(Constants.Properties.AUTO);
        //cellFiles.alignTop();
      }

      /*
      if(tbody)tbody.setHeightPixels(h-24); // Subtract 24 pixels for the table header (thead) element.

      if(unorderedList)unorderedList.setHeightPixels(h);
      if(unorderedList)unorderedList.fixedHeight(h);
      //*/

      if(tbody)tbody.setHeightPixels(h-24); // Subtract 24 pixels for the table header (thead) element.

      if(unorderedList)unorderedList.setHeightPixels(h);

      cellPanel.fixedHeight(h);

    });

  }

  /*
  ,setFileViewsWidthHeight:function(widthHeight){
    Ispaces.logger.debug(this.id+'.setFileViewsWidthHeight('+widthHeight+')');

    var cellPanel
    ,divFiles
    ,panelCells=this.panelCells
    ,i
    ,z=panelCells.length
    ;

    for(i=0;i<z;i++){

      cellPanel=panelCells[i]
      ,divFiles=cellPanel.divFiles
      ;

      //Ispaces.logger.debug('divFiles.setWidthHeightPixels('+widthHeight+')');
      divFiles.setWidthHeightPixels(widthHeight[0],widthHeight[1]);
      //divFiles.setWidthHeightPixels((widthHeight[0]-1),widthHeight[1]);
      //divFiles.di(Constants.Properties.BLOCK);

      //divFiles.widthHeight=widthHeight; // set the widthHeight as a property of the divFiles. @see resetPanels() - does nto work - widthHeight[1] = 0
    }
  }
  */

  ,adjustHeight:function(h){
    //Ispaces.logger.debug(this.id+'.adjustHeight('+h+')');

    /*
    if(!h){
      h=Common.getHeight(this.divApplication);
      Ispaces.logger.debug('h = '+h);
    }

    var bottomMenu=33;
    h-=bottomMenu;
    Ispaces.logger.debug('h = '+h);

    var borderTop=5;
    h-=borderTop;
    Ispaces.logger.debug('h = '+h);
    */
    h-=38;

    /*
     * Adjust the divMain height after subtracting the ...
     */
    //Ispaces.logger.debug('this.divMain.setHeightPixels('+h+')');
    this.divMain.setHeightPixels(h);

    this.adjustFileViewsHeights(h);
  }

  ,adjustFileViewsHeights:function(h){
    //Ispaces.logger.debug(this.id+'.adjustFileViewsHeights('+h+')');

    var adjustment=h-this.height;
    //Ispaces.logger.debug('adjustment = '+adjustment);

    var cellPanel
    ,cellFiles
    ,panelCells=this.panelCells
    ,i
    ,z=panelCells.length
    ;

    for(i=0;i<z;i++){

      cellPanel=panelCells[i]
      ,cellFiles=cellPanel.cellFiles
      ;

      //Ispaces.logger.debug('cellFiles.setHeightPixels('+(cellFiles._height+adjustment)+')');
      //cellFiles.setHeightPixels(cellFiles.h+adjustment);
      //Ispaces.logger.debug('cellFiles.setHeightPixels('+(cellFiles._height)+')');
      cellFiles.setHeightPixels(cellFiles._height);

    }
  }

  ,adjustPanelWidthsPercent:function(w){
    Ispaces.logger.debug(this.id+'.adjustPanelWidthsPercent('+w+')');

    var cellPanel
    ,panelWidth
    ,widthPercent
    ,panelCells=this.panelCells
    ,panelCellsLength=panelCells.length
    ;

    //Ispaces.logger.debug('panelCellsLength = '+panelCellsLength);
    //Ispaces.logger.debug('((panelCellsLength-1)*this.grabberWidth) = '+((panelCellsLength-1)*this.grabberWidth));
    //w-=((panelCellsLength-1)*this.grabberWidth); // Adjust the width for the center grabbers

    //var totalGrabberWidth=(panelCellsLength-1)*9+(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //var totalGrabberWidth=(panelCellsLength-1)*this.grabberWidth+(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    var totalGrabberWidth=(panelCellsLength-1)*this.grabberWidth; // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //Ispaces.logger.debug('totalGrabberWidth = '+totalGrabberWidth);

    w-=totalGrabberWidth; // Adjust the width for the center grabbers.
    //Ispaces.logger.debug('w = '+w);

    //Ispaces.logger.debug(this.id+'.adjustPanelWidthsPercent('+w+')');

    for(var i=0;i<panelCellsLength;i++){

      cellPanel=panelCells[i];

      //cellPanel.setOverflow(Constants.Properties.HIDDEN);

      /*
      panelWidth=Common.getWidth(cellPanel);
      Ispaces.logger.debug('panelWidth = '+panelWidth);
      widthPercent=panelWidth/w;
      widthPercent=(panelWidth/w).toFixed(2);
      Ispaces.logger.debug('widthPercent = '+widthPercent);
      //*/

      panelWidth=Common.getWidth(cellPanel);
      //Ispaces.logger.debug('panelWidth = '+panelWidth);

      //widthPercent=(panelWidth/w);
      //widthPercent=((panelWidth/w)*100).toFixed(2);
      widthPercent=(panelWidth/w).toFixed(4); // toFixed(4) gives us better accuracy when adjust panel widths
      //Ispaces.logger.debug('widthPercent = '+widthPercent);

      cellPanel.widthPercent=widthPercent;
    }
  }

  /*
   * Adjust the panelCells using their percent widths.
   *
   * Since the adjustment is calculated by percent, the sum of the calculated width may not exactly equal the divMain width.
   * For a tighter implementation, adjust the last panel based on the remainder.
   */
  ,adjustPanels:function(w){
    //Ispaces.logger.debug(this.id+'.adjustPanels('+w+')');

    //Ispaces.logger.debug('Common.getWidth(this.divApplication) = '+Common.getWidth(this.divApplication));
    //Ispaces.logger.debug('Common.getWidth(this.divMain) = '+Common.getWidth(this.divMain));
    //Ispaces.logger.debug('Common.getWidth(this.panelRow) = '+Common.getWidth(this.panelRow));

    if(!w)w=Common.getWidth(this.divApplication);

    var cellPanel
    ,panelCells=this.panelCells
    ,panelCellsLength=panelCells.length
    ,i
    ;

    //w-=((panelCellsLength-1)*8); // Adjust the width for the center grabbers.
    //var totalGrabberWidth=(panelCellsLength-1)*9+(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //var totalGrabberWidth=(panelCellsLength-1)*9; // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    var totalGrabberWidth=(panelCellsLength-1)*this.grabberWidth; // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //Ispaces.logger.debug('totalGrabberWidth = '+totalGrabberWidth);

    // Adjust the width for any borders.
    /*
    //var borderWidth=(8*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    var borderWidth=(this.borderWidth*2); // the count of panelCells minus one * width of grabber, plus the two outer borders which are 8 pixels wide.
    //Ispaces.logger.debug('borderWidth = '+borderWidth);
    w-=borderWidth;
    //Ispaces.logger.debug('w = '+w);
    */

    /*
     * Adjust the divMain width after subtracting the border widths.
     */
    //Ispaces.logger.debug('this.divMain.setWidthPixels('+w+')');
    this.divMain.setWidthPixels(w);

    w-=totalGrabberWidth; // Adjust the width for the center grabbers.
    //Ispaces.logger.debug('w = '+w);

    //var totalNewWidth=0;

    var cellFiles
    ,tbody
    ,unorderedList
    ,widthPercent
    ,newWidth
    ;

    //for(i=0;i<panelCellsLength;i++){
      //cellPanel=panelCells[i]
    panelCells.forEach(function(cellPanel){

      cellFiles=cellPanel.cellFiles
      ,tbody=cellPanel.tbody
      ,unorderedList=cellPanel.unorderedList
      ,widthPercent=cellPanel.widthPercent
      ,newWidth=Math.round(w*widthPercent)
      //,isTree=cellPanel.isTree
      ;

      //Ispaces.logger.debug('isTree = '+isTree);
      //Ispaces.logger.debug('widthPercent = '+widthPercent);
      //Ispaces.logger.debug('newWidth = '+newWidth);
      //Ispaces.logger.debug('widthPercent = '+widthPercent+', newWidth = '+newWidth);

      //totalNewWidth+=newWidth;

      //Ispaces.logger.debug('cellPanel.setWidthPixels('+newWidth+'),cellPanel.setMaxWidth('+newWidth+')');

      //cellPanel.setWidthPixels(newWidth),cellPanel.setMaxWidth(newWidth),cellPanel.setMinWidth(newWidth); // maWi() allows the overflow to work.
      //cellPanel.setWidthPixels(newWidth),cellPanel.setMaxWidth(newWidth); // maWi() allows the overflow to work.
      cellPanel.fixedWidth(newWidth); // maWi() allows the overflow to work.
      //cellPanel.setWidthPixels(newWidth);//,cellPanel.setMaxWidth(newWidth); // maWi() allows the overflow to work.

      /*
       * Also set the width of the cellFiles so the overflow works when resizing panelCells.
       * We subtract 2 pixels from the width here so that the cellFiles does not overshoot the cellFiles and the panel border remains visible.
       */
      //cellPanel.cellFiles.setWidthPixels((newWidth-2));
      //cellPanel.cellFiles.setWidthPixels((newWidth-1));
      //cellPanel.cellFiles.setWidthPixels(newWidth);

      /*
      if(isTree){
        cellPanel.cellFiles.setWidthPixels(newWidth);
      }else{
        //cellPanel.cellFiles.setWidthPixels(newWidth);
        if(cellPanel.tbody){
          Ispaces.logger.debug('cellPanel.tbody.setWidthPixels('+newWidth+')');
          cellPanel.tbody.setWidthPixels(newWidth);
          //cellPanel.tbody.setOverflow('scroll');
          //cellPanel.tbody.di('block');
        }
      }
      */

      //if(cellFiles)cellFiles.setWidthPixels(newWidth);
      if(cellFiles)cellFiles.fixedWidth(newWidth);

      if(tbody){
        //Ispaces.logger.debug('tbody.setWidthPixels('+newWidth+')');
        tbody.setWidthPixels(newWidth);
      }

      if(unorderedList){
        //Ispaces.logger.debug('unorderedList.setWidthPixels('+newWidth+')');
        unorderedList.setWidthPixels(newWidth);
      }

    });

    //Ispaces.logger.debug('totalNewWidth = '+totalNewWidth);
  }

  /*
   * Adjust the panelCells from their current width, which is trickier than just dividing the width up equally... panelWidth=parseInt(w/count);
   * The problem here is when one of the panelCells reaches a width of zero. The other panelCells have to continue getting smaller.
   */
  /*
  ,adjustPanelsBak:function(w){
    Ispaces.logger.debug(this.id+'.adjustPanels('+w+')');

    if(!w)w=Common.getWidth(this.divMain);

    var resize=this.w-w;
    Ispaces.logger.debug('this.w = '+this.w+', resize = '+resize);

    //var panelCells=this.panelCells,count=panelCells.size();
    var panelCells=this.panelCells,count=Common.getSize(panelCells);
    Ispaces.logger.debug('count = '+count);

    var panelResize=Math.round(resize/count);
    Ispaces.logger.debug('panelResize = '+panelResize);

    //var modulus=resize%count;
    //Ispaces.logger.debug('modulus = '+modulus);
    //Ispaces.logger.debug('count = '+count+', modulus = '+modulus);

    var cellPanel,panelWidth;
    var totalWidth=0;

    for(var p in panelCells){

      cellPanel=panelCells[p];

      panelWidth=cellPanel.w;
      totalWidth+=panelWidth;
      Ispaces.logger.debug("cellPanel.id = "+cellPanel.id+", panelWidth = "+panelWidth+", panelResize = "+panelResize);
      newPanelWidth=panelWidth-panelResize;

      if(newPanelWidth<0){ // If the panel width reaches zero, we have to readjust.
        count--;
        panelResize=Math.round(resize/count);
      }

      Ispaces.logger.debug('cellPanel.setWidthPixels('+newPanelWidth+')');
      cellPanel.setWidthPixels(newPanelWidth),cellPanel.setMaxWidth(newPanelWidth); // maWi() allows the overflow to work.

    }
    //Ispaces.logger.debug('totalWidth = '+totalWidth);
  }
  */

  /*
  ,resizePanel:function(e,panelLeft,panelRight,startX,leftWidth,rightWidth){
    Ispaces.logger.debug(this.id+".resizePanel("+e+", panelLeft:"+panelLeft+", panelRight:"+panelRight+", startX:"+startX+", leftWidth:"+leftWidth+", rightWidth:"+rightWidth+")");

    var mouseX=Common.getMouseX(e);
    Ispaces.logger.debug("mouseX = "+mouseX);

    var mouseMovedX=(mouseX-startX);
    Ispaces.logger.debug("mouseMovedX = "+mouseMovedX);

    panelLeft.setWidthPixels(leftWidth+mouseMovedX),panelRight.setWidthPixels(rightWidth-mouseMovedX);
  }
  */

  /*
  ,resizePanel:function(e,panelLeft,panelRight,mouseXY,panelLeftWidthHeight,panelRightWidthHeight){
    Ispaces.logger.debug(this.id+'.resizePanel('+e+', '+panelLeft+', '+panelRight+', '+mouseXY+', '+panelLeftWidthHeight+', '+panelRightWidthHeight+')');
    var resizeXY=Common.getMouseXY(e);
    Ispaces.logger.debug("resizeXY[0]="+resizeXY[0]+", resizeXY[1]="+resizeXY[1]);
    var mouseMovedX=(resizeXY[0]-mouseXY[0]);
    Ispaces.logger.debug("mouseMovedX = "+mouseMovedX);
    var newPanelLeft=(panelLeftWidthHeight[0]+mouseMovedX);
    var newPanelRight=(panelRightWidthHeight[0]-mouseMovedX);
    Ispaces.logger.debug("newPanelLeft = "+newPanelLeft+", newPanelRight = "+newPanelRight);
    panelLeft.setWidthPixels(newPanelLeft);
    panelRight.setWidthPixels(newPanelRight);
  }
  */

  /**
   * End of Resizing.
   */



  /*
   * Drag & Drop
   */

  /*
   * Drag
   * Check if the drag is over this app first.
   * Then check the folders, then panelCells.
   * @override
   */
  /**
   * @param a an array of HTML Element folders.
   */
  /*
  ,addDropFolders:function(dropFolders){
    Ispaces.logger.debug(this.id+'.addDropFolders('+dropFolders+')');

    dropFolders.forEach(this.addDropFolder.bind(this)); // Native functions: forEach and bind ... for speed.
  }
  */

  /**
   * @param o an HTML Element object representing a folder.
   */
  /*
  ,addDropFolder:function(dropFolder){
    Ispaces.logger.debug(this.id+'.addDropFolder('+dropFolder+')');

    //if(!this.dropFolders)this.dropFolders=[]; // lazy loading?
    this.dropFolders.push(dropFolder);
  }
  */

  /*
  ,addDropTargets:function(a){
    //Ispaces.logger.debug(this.id+'.addDropTargets('+a+')');
    this.dropTargets.clear();
    a.forEach(this.addDropTarget.bind(this)); // Native fun.
  }

  ,addDropTarget:function(o){
    //Ispaces.logger.debug(this.id+'.addDropTarget('+o+')');
    //if(!this.dropTargets)this.dropTargets=[]; // lazy loading?
    this.dropTargets.push(o);
  }
  */

  /*
  ,addDropPanels:function(dropPanels){
    Ispaces.logger.debug(this.id+'.dropPanels('+dropPanels+')');

    this.dropPanels.clear();
    dropPanels.forEach(this.addDropPanel.bind(this)); // Native fun.
  }

  ,addDropPanel:function(dropPanel){
    Ispaces.logger.debug(this.id+'.addDropPanel('+dropPanel+')');

    //if(!this.dropPanels)this.dropPanels=[]; // lazy loading?
    this.dropPanels.push(dropPanel);
  }
  */

  ,drag:function(x,y,draggable){
    //Ispaces.logger.debug(this.id+'.drag('+x+', '+y+', '+draggable+')');

    var divApplicationWindow=this.divApplicationWindow
    ,windowXY=divApplicationWindow._xy
    ,windowWidthHeight=divApplicationWindow.widthHeight
    ;

    if(!windowXY)windowXY=divApplicationWindow._xy=Common.getXY(divApplicationWindow);
    if(!windowWidthHeight)windowWidthHeight=divApplicationWindow.widthHeight=Common.getWidthHeight(divApplicationWindow);

    //Ispaces.logger.debug('windowXY = '+windowXY);
    //Ispaces.logger.debug('windowWidthHeight = '+windowWidthHeight);

    var windowX=windowXY[0]
    ,windowY=windowXY[1]
    ,windowWidth=windowWidthHeight[0]
    ,windowHeight=windowWidthHeight[1]
    ;

    if(
      (x>windowX)
      &&(x<(windowX+windowWidth))
      &&(y>windowY)
      &&(y<(windowY+windowHeight))
    ){

      if(!this.isOver){
        this.isOver=true;
        this.dragEnter(draggable);
      }

      // check folders
      //if(this.dropFolders.some(this.checkDragFolders.bind(this,x,y,draggable)))return true; // if handled return true

      // check panelCells
      //if(this.panelCells.some(this.checkDragPanels.bind(this,x,y,draggable)))return true; // handled?

      if(this.panelCells.some(this.checkDrag.bind(this,x,y,draggable)))return true; // handled?

      return true; // handled! This FileManager was the top-most element and has received and handled the drag event.

    }else if(this.isOver){
      this.isOver=false;
    }

    return false; // not handled!
  }

  /* Now using checkDragPanels and checkDragFolder instead.
  ,checkDragFolders:function(x,y,draggable,folder){
    //Ispaces.logger.debug(this.id+'.checkDragFolders(x:'+x+', y:'+y+', draggable:'+draggable+', folder:'+folder+')');

    // Get the panel from the XY coordinates. There may be a better way of doing this by getting the panel from the drop folder.
    var cellPanel
    ,panelCells=this.panelCells
    ,panelCellsLength=panelCells.length
    ,i
    ;

    // Get the cellPanel by iterating over the panelCells array.
    // There may be a better way of doing this.
    for(i=0;i<panelCellsLength;i++){

      cellPanel=panelCells[i];

      var cellPanelXY=cellPanel._xy
      ,cellPanelWidthHeight=cellPanel.widthHeight
      ;

      if(!cellPanelXY)cellPanelXY=cellPanel._xy=Common.getXY(cellPanel);
      if(!cellPanelWidthHeight)cellPanelWidthHeight=cellPanel.widthHeight=Common.getWidthHeight(cellPanel);

      //Ispaces.logger.debug('cellPanelXY = '+cellPanelXY);
      //Ispaces.logger.debug('cellPanelWidthHeight = '+cellPanelWidthHeight);

      if(
        (x>cellPanelXY[0])
        &&(x<(cellPanelXY[0]+cellPanelWidthHeight[0]))
        &&(y>cellPanelXY[1])
        &&(y<(cellPanelXY[1]+cellPanelWidthHeight[1]))
      ){

        //Ispaces.logger.debug(this.id+'.checkDragFolders(x:'+x+', y:'+y+', folder:'+folder+'): break; '+cellPanel.filePath);
        //Ispaces.logger.info(this.id+'.checkDragFolders(x:'+x+', y:'+y+', folder:'+folder+'): Break when the xy is inside a cellPanel.');

        break; // Break when the xy is inside a cellPanel.
      }
    }

    var folderXY=folder._xy;
    var folderWidthHeight=folder.widthHeight;

    if(!folderXY)folderXY=folder._xy=Common.getXY(folder);
    if(!folderWidthHeight)folderWidthHeight=folder.widthHeight=Common.getWidthHeight(folder);

    //Ispaces.logger.debug('folderXY = '+folderXY);
    //Ispaces.logger.debug('folderWidthHeight = '+folderWidthHeight);

    if(
      (x>folderXY[0])
      &&(x<(folderXY[0]+folderWidthHeight[0]))
      &&(y>folderXY[1])
      &&(y<(folderXY[1]+folderWidthHeight[1]))
    ){

      if(!folder.isOver){

        folder.isOver=true;

        this.enterFolder(
          folder
          ,draggable
          ,cellPanel
        );
      }

      return true;

    }else if(folder.isOver){

      folder.isOver=false;
      this.leaveFolder(folder,draggable);
    }

    return false;
  }
  //*/

  /*
  ,checkDragPanels:function(
    x,y
    ,draggable
    ,cellPanel
  ){
    //Ispaces.logger.debug(this.id+'.checkDragPanels(x:'+x+', y:'+y+', draggable:'+draggable+', cellPanel:'+cellPanel+')');

    var cellPanelXY=cellPanel._xy
    ,cellPanelWidthHeight=cellPanel.widthHeight
    ;

    if(!cellPanelXY)cellPanelXY=cellPanel._xy=Common.getXY(cellPanel);
    if(!cellPanelWidthHeight)cellPanelWidthHeight=cellPanel.widthHeight=Common.getWidthHeight(cellPanel);

    //Ispaces.logger.debug('cellPanelXY = '+cellPanelXY);
    //Ispaces.logger.debug('cellPanelWidthHeight = '+cellPanelWidthHeight);

    if(
      (x>cellPanelXY[0])
      &&(x<(cellPanelXY[0]+cellPanelWidthHeight[0]))
      &&(y>cellPanelXY[1])
      &&(y<(cellPanelXY[1]+cellPanelWidthHeight[1]))
    ){

      if(!cellPanel.isOver){
        cellPanel.isOver=true;
        this.enterPanel(cellPanel,draggable);
      }

      return true;

    }else if(cellPanel.isOver){

      cellPanel.isOver=false;
      this.leavePanel(cellPanel,draggable);
    }

    return false;
  }
  */

  ,checkDrag:function(x,y,draggable,cellPanel){
    //Ispaces.logger.debug(this.id+'.checkDrag(x:'+x+', y:'+y+', draggable:'+draggable+', cellPanel:'+cellPanel+')');

    var cellPanelXY=cellPanel._xy
    ,cellPanelWidthHeight=cellPanel.widthHeight
    ;

    if(!cellPanelXY)cellPanelXY=cellPanel._xy=Common.getXY(cellPanel);
    if(!cellPanelWidthHeight)cellPanelWidthHeight=cellPanel.widthHeight=Common.getWidthHeight(cellPanel);

    //Ispaces.logger.debug('cellPanelXY = '+cellPanelXY);
    //Ispaces.logger.debug('cellPanelWidthHeight = '+cellPanelWidthHeight);

    if(
      (x>cellPanelXY[0])
      &&(x<(cellPanelXY[0]+cellPanelWidthHeight[0]))
      &&(y>cellPanelXY[1])
      &&(y<(cellPanelXY[1]+cellPanelWidthHeight[1]))
    ){

      if(!cellPanel.isOver){
        cellPanel.isOver=true;
        this.enterPanel(cellPanel,draggable);
      }

      //Ispaces.logger.debug(this.id+'.checkDrag('+x+', '+y+', '+draggable+', '+cellPanel+'): cellPanel.dropFolders = '+cellPanel.dropFolders);
      Ispaces.logger.debug('cellPanel.dropFolders = '+cellPanel.dropFolders);

      // Check folders within this panel.
      //var dropFolders=cellPanel.dropFolders;
      //if(dropFolders)if(dropFolders.some(this.checkDragFolder.bind(this,x,y,draggable)))return true; // if handled return true
      //if(dropFolders){
      if(cellPanel.dropFolders){
        Ispaces.logger.debug('cellPanel.dropFolders.length = '+cellPanel.dropFolders.length);
        //if(dropFolders.some(this.checkDragFolder.bind(this,x,y,draggable,cellPanel))){
        if(cellPanel.dropFolders.some(this.checkDragFolder.bind(this,x,y,draggable,cellPanel))){
          return true; // if handled return true
        }
      }

      return true;

    }else if(cellPanel.isOver){

      cellPanel.isOver=false;
      this.leavePanel(cellPanel,draggable);

    }

    return false;
  }

  ,checkDragFolder:function(x,y,draggable,cellPanel,folder){
    //Ispaces.logger.debug(this.id+'.checkDragFolder(x:'+x+', y:'+y+', draggable:'+draggable+', cellPanel:'+cellPanel+', folder:'+folder+')');
    //Ispaces.logger.debug(this.id+'.checkDragFolder('+x+', '+y+', '+draggable+', '+cellPanel+', '+folder+')');

    var folderXY=folder._xy;
    var folderWidthHeight=folder.widthHeight;

    if(!folderXY)folderXY=folder._xy=Common.getXY(folder);
    if(!folderWidthHeight)folderWidthHeight=folder.widthHeight=Common.getWidthHeight(folder);

    //Ispaces.logger.debug('folderXY = '+folderXY);
    //Ispaces.logger.debug('folderWidthHeight = '+folderWidthHeight);
    //Ispaces.logger.debug('folderXY = '+folderXY+', folderWidthHeight = '+folderWidthHeight);

    if(
      (x>folderXY[0])
      &&(x<(folderXY[0]+folderWidthHeight[0]))
      &&(y>folderXY[1])
      &&(y<(folderXY[1]+folderWidthHeight[1]))
    ){

      if(!folder.isOver){

        //,leaveFolder:function(target,draggable){
        //if(cellPanel.folderOver)this.leaveFolder(folder,draggable);
        //if(cellPanel.folderOver)this.leaveFolder(cellPanel.folderOver,draggable);

        folder.isOver=true;

        this.enterFolder(
          folder
          ,draggable
          ,cellPanel
        );
      }

      return true;

    }else if(folder.isOver){

      folder.isOver=false;
      this.leaveFolder(folder,draggable);
    }

    return false;
  }

  ,dragEnter:function(draggable){
    Ispaces.logger.debug(this.id+'.mouseEnter(draggable:'+draggable+')');

    draggable.rowBottom.hide();
    draggable.isOverDesktop=false;
  }

  ,enterPanel:function(cellPanel,draggable){
    Ispaces.logger.debug(this.id+'.enterPanel(cellPanel:'+cellPanel+', draggable:'+draggable+')');

    var protocol=cellPanel.protocol;
    if(protocol){

      draggable.setFileName(new Ispaces.StringBuilder([protocol,':/']).asString());

      draggable.rowBottom.show();
    }
    //cellPanel.isOver=true;
  }

  ,leavePanel:function(cellPanel,draggable){
    Ispaces.logger.debug(this.id+'.leavePanel(cellPanel.id:'+cellPanel.id+', draggable:'+draggable+')');

    draggable.rowBottom.hide();
    //cellPanel.isOver=false;
    draggable.isOverDesktop=false;
  }

  ,enterFolder:function(folderElement,draggable,cellPanel){
    Ispaces.logger.debug(this.id+'.enterFolder(folderElement:'+folderElement+', draggable:'+draggable+', cellPanel:'+cellPanel+')');

    // If the leaveFolder gets stuck on, this checks for and leaves the previous folderElement while entering this folderElement.
    var folderOver=cellPanel.folderOver;

    if(
      folderOver
      &&folderOver.isOver
    ){
      this.leaveFolder(folderOver,draggable); // Leave the previous folderElement.
    }

    this.fileElement=folderElement;
    cellPanel.folderOver=folderElement; // Set a reference to the current folderElement on the cellPanel, so that it becomes the leaveFolder next time round.
    cellPanel.fileElement=folderElement; // select the li by setting a reference  on the cellPanel.
    folderElement.isSelected=true;
    folderElement.isOver=true;          // Set the isOver flag on the current folderElement.
    folderElement.setClass("dragged");

    var folderName=folderElement.fileName
    ,targetProtocol=folderElement.protocol
    ;

    Ispaces.logger.debug('folderName = "'+folderName+'"');
    Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');

    draggable.setFileName(folderName);
    //draggable.setPath(filePath);
    draggable.rowBottom.show();
    draggable.isOverDesktop=false;

    //* Temporarily removed.
    if(!folderElement.openFolderCall){
      Ispaces.logger.debug('folderElement.openFolderCall=new Ispaces.AsyncApply(...');
      folderElement.openFolderCall=new Ispaces.AsyncApply(
        this
        ,"toggleOpenFolder"
        //,[folderElement]
        ,[folderElement.parentNode] // parentNode of the folderElement is the List Item?
        ,1000
      );
    }
    //*/
  }

  ,leaveFolder:function(folderElement,draggable){
    Ispaces.logger.debug(this.id+'.leaveFolder(folderElement:'+folderElement+', draggable:'+draggable+')');

    Ispaces.logger.debug('folderElement.filePath = '+folderElement.filePath);

    folderElement.isOver=false;

    folderElement.setClass('');
    //folderElement.style.outline='';

    /*
    var draggableTarget=this.draggableTarget;
    //Ispaces.logger.debug('draggableTarget = '+draggableTarget);
    //if(!draggableTarget)draggableTarget=this.draggableTarget=this.Create.createDraggableTarget(); // If the draggable folder has not been created before, create it.

    //draggableTarget.bottomDiv.hide();
    draggableTarget.rowBottom.hide();
    */
    draggable.rowBottom.hide();

    //* Temporarily removed.
    Ispaces.logger.debug('folderElement.openFolderCall = '+folderElement.openFolderCall);
    if(folderElement.openFolderCall){
      folderElement.openFolderCall.cancel();
      folderElement.openFolderCall=null;
    }
    //*/
  }

  /*
   * Drop
   * Catch-all mouseUp function for the FileManager.
   * Checks for the presence of the global draggable. i.e. Ispaces.global.draggable
   * Resets the global draggable to null for the next drag. Only if the mouseUp() was handled. Otherwise the global draggable passes to the next handler.
   * @return true if this function was able to process the mouse up event.
   */
  ,mouseUp:function(e,draggable){
    Ispaces.logger.debug(this.id+'.mouseUp(e:'+e+', draggable:'+draggable+')');

    var _this=this;

    if(_this.dragPanelFunction){
      Ispaces.logger.debug('typeof this.dragPanelFunction = '+typeof this.dragPanelFunction);
      Ispaces.logger.debug('this.cellPanelDragging = '+this.cellPanelDragging);

      //removeListener(document,MOUSEMOVE,this.dragPanelFunction,false);
      //this.dragPanelFunction=null;
      //this.cellPanelDragging.mouseUp(e);
      _this.mouseUpPanel(_this.cellPanelDragging,e);
    }

    if(this.resizePanelFunction){

      Ispaces.logger.debug('typeof this.resizePanelFunction = '+typeof this.resizePanelFunction);
      Common.removeListener(
        document
        ,_this.Events.MOUSEMOVE
        ,_this.resizePanelFunction
      );
      _this.resizePanelFunction=null;

      _this.resetPositions(); // for dnd
    }

    if(this.mouseMoveFunction){
      Ispaces.logger.debug('typeof this.mouseMoveFunction = '+typeof this.mouseMoveFunction);

      //_this.listItem.div.mouseUp(e);
      _this.fileElement.div.mouseUp(e);

      Common.removeListener(
        document
        ,_this.Events.MOUSEMOVE
        ,_this.mouseMoveFunction
      );

      this.mouseMoveFunction=null;

      /*
       * The mouseUp() function gets called twice.
       * Once from Space.mouseUpCapturing() and once from the Ispaces.global.draggableObject being caught in the global catch-all Common.mouseUp() function.
       * Do we need to nullify the global draggable object here?
       */
      //Ispaces.global.draggableObject=null;
    }

    //var dropTarget=Ispaces.dropObject;
    //var draggable=this.draggable||Ispaces.draggable; // The drag element can either be attached locally or on the global Ispaces draggable.
    //var draggable=Ispaces.draggable; // The drag element can either be attached locally or on the global Ispaces draggable.
    //var draggable=Ispaces.global.draggable; // The drag element can either be attached locally or on the global Ispaces draggable.

    if(draggable){

      Ispaces.logger.debug('draggable.filePath = '+draggable.filePath);
      //Ispaces.logger.debug('draggable.fileName = '+draggable.fileName);

      /*
      Ispaces.logger.debug(this.id+'.mouseUp('+e+'): Ispaces.global.mouseUpObject = '+Ispaces.global.mouseUpObject);
      Ispaces.logger.debug(this.id+'.mouseUp('+e+'): Ispaces.global.mouseUpObject=null;');
      Ispaces.global.mouseUpObject=null; // Reset the global mouseUp object to null, for the next drag.
      */

      /*
      var mouseXY=Common.getMouseXY(e)
      ,x=mouseXY[0]
      ,y=mouseXY[1]
      ;
      //Ispaces.logger.debug('mouseXY = '+mouseXY);
      */

      /*
       * Get the cellPanel from the XY coordinates of the mouseup.
       * Temporary. There may be a better way of doing this by getting the cellPanel from the drop folder.
       */
      //*
      var cellPanel
      ,panelCells=this.panelCells
      //,x=e.pageX
      ,x=Common.getMouseX(e)
      //,y=e.pageY
      ,y=Common.getMouseY(e)
      ,panelCellsLength=panelCells.length
      ,i
      ;

      for(i=0;i<panelCellsLength;i++){

        cellPanel=panelCells[i]
        ,cellPanelXY=cellPanel._xy
        ,cellPanelWidthHeight=cellPanel.widthHeight
        ;

        if(!cellPanelXY)cellPanelXY=cellPanel._xy=Common.getXY(cellPanel);
        if(!cellPanelWidthHeight)cellPanelWidthHeight=cellPanel.widthHeight=Common.getWidthHeight(cellPanel);

        //Ispaces.logger.debug('cellPanelXY = '+cellPanelXY);
        //Ispaces.logger.debug('cellPanelWidthHeight = '+cellPanelWidthHeight);

        var cellPanelX=cellPanelXY[0]
        ,cellPanelY=cellPanelXY[1]
        ,cellPanelWidth=cellPanelWidthHeight[0]
        ,cellPanelHeight=cellPanelWidthHeight[1]
        ;

        /*
        if(
          (x>cellPanelXY[0])
          &&(x<(cellPanelXY[0]+cellPanelWidthHeight[0]))
          &&(y>cellPanelXY[1])
          &&(y<(cellPanelXY[1]+cellPanelWidthHeight[1]))
        ){
        */
        if(
          (x>cellPanelX)
          &&(x<(cellPanelX+cellPanelWidth))
          &&(y>cellPanelY)
          &&(y<(cellPanelY+cellPanelHeight))
        ){

          //Ispaces.logger.debug(this.id+'.mouseUp('+e+'): cellPanel.id='+cellPanel.id+', cellPanel.panelIndex='+cellPanel.panelIndex+', cellPanel.filePath='+cellPanel.filePath);
          Ispaces.logger.info('draggable was dropped over panel '+cellPanel.id);
          //break;

          /*
          if(cellPanel.dropFolders){
            if(cellPanel.dropFolders.some(this.checkDragFolder.bind(this,x,y,draggable,cellPanel))){
              return true; // if handled return true
            }
          }
          */
          var dropFolders=cellPanel.dropFolders;
          Ispaces.logger.debug('dropFolders = '+dropFolders);

          if(dropFolders.length>0){ // Drag & Drop
            Ispaces.logger.debug('dropFolders.length = '+dropFolders.length);

            var folder
            ,folderXY
            ,folderX
            ,folderY
            ,folderWidthHeight
            ,folderWidth
            ,folderHeight
            ,dropFoldersLength=dropFolders.length
            ,i
            ;

            for(i=0;i<dropFoldersLength;i++){

              folder=dropFolders[i];

              folderXY=Common.getXY(folder)
              ,folderX=folderXY[0]
              ,folderY=folderXY[1]
              ;

              folderWidthHeight=Common.getWidthHeight(folder)
              ,folderWidth=folderWidthHeight[0]
              ,folderHeight=folderWidthHeight[1]
              ;

              if(
                (x>folderX)
                &&(x<(folderX+folderWidth))
                &&(y>folderY)
                &&(y<(folderY+folderHeight))
              ){
                Ispaces.logger.debug('draggable was dropped onto folder '+folder+', filePath='+folder.filePath);
                //Ispaces.logger.debug('draggable.filePath = '+draggable.filePath+', folder.filePath='+folder.filePath);

                this.dropFolder(
                  draggable
                  ,cellPanel
                  ,folder
                );

                //Ispaces.draggable=null; // Reset the draggable to null after retrieving it... for the next drag. Only if the mouseUp() was handled.
                //e.handled=true; // Set a custom flag on this event object, telling other event listeners that the event has been handled.
                //break;
                return true;
              }
            }
          }else{
            Ispaces.logger.warn(this.id+'.mouseUp(e:'+e+', draggable:'+draggable+'): dropFolders is empty');
          } // if(dropFolders.length>0){ // Drag & Drop

          this.drop(
            draggable
            ,cellPanel
          );

          return true;

        }
      }
      //*/

      /*
      //Ispaces.logger.debug('this.dropFolders.length = '+this.dropFolders.length);

      //var dropFolders=this.dropFolders;
      var dropFolders=cellPanel.dropFolders;
      Ispaces.logger.debug('dropFolders.length = '+dropFolders.length);

      if(dropFolders.length>0){ // Drag & Drop

        var folder
        ,folderXY
        ,folderX
        ,folderY
        ,folderWidthHeight
        ,folderWidth
        ,folderHeight
        ,dropFoldersLength=dropFolders.length
        ,i
        ;

        for(i=0;i<dropFoldersLength;i++){

          folder=dropFolders[i];

          folderXY=Common.getXY(folder)
          ,folderX=folderXY[0]
          ,folderY=folderXY[1]
          ;

          folderWidthHeight=Common.getWidthHeight(folder)
          ,folderWidth=folderWidthHeight[0]
          ,folderHeight=folderWidthHeight[1]
          ;

          if(
            (x>folderX)
            &&(x<(folderX+folderWidth))
            &&(y>folderY)
            &&(y<(folderY+folderHeight))
          ){
            Ispaces.logger.debug('draggable was dropped onto folder '+folder+', filePath='+folder.filePath);
            //Ispaces.logger.debug('draggable.filePath = '+draggable.filePath+', folder.filePath='+folder.filePath);

            this.dropFolder(
              draggable
              ,cellPanel
              ,folder
            );

            //Ispaces.draggable=null; // Reset the draggable to null after retrieving it... for the next drag. Only if the mouseUp() was handled.
            //e.handled=true; // Set a custom flag on this event object, telling other event listeners that the event has been handled.
            //break;
            return true;
          }
        }
      } // if(dropFolders.length>0){ // Drag & Drop
      //*/

      /*
      Ispaces.logger.debug('this.dropPanels = '+this.dropPanels);
      var dropPanels=this.dropPanels; // dropPanels is an array of panelCells.
      Ispaces.logger.debug('dropPanels.length = '+dropPanels.length);

      if(dropPanels.length>0){ // Drag & Drop

        var mouseXY=Common.getMouseXY(e);
        //Ispaces.logger.debug('mouseXY = '+mouseXY);

        for(var i=0;i<dropPanels.length;i++){

          var cellPanel=dropPanels[i];
          if(cellPanel){

            var cellPanelXY=Common.getXY(cellPanel);
            var cellPanelWidthHeight=Common.getWidthHeight(cellPanel);
            //var cellPanelWidth=parseInt(cellPanel.offsetWidth);
            //var cellPanelHeight=parseInt(cellPanel.offsetHeight);

            //Ispaces.logger.debug('cellPanelXY = '+cellPanelXY);
            //Ispaces.logger.debug('cellPanelWidthHeight = '+cellPanelWidthHeight);
            //Ispaces.logger.debug('mouseUp(e): cellPanelWidth = '+cellPanelWidth+', cellPanelHeight = '+cellPanelHeight);

            if(
              (mouseXY[0]>cellPanelXY[0])
              &&(mouseXY[0]<(cellPanelXY[0]+cellPanelWidthHeight[0]))
              &&(mouseXY[1]>cellPanelXY[1])
              &&(mouseXY[1]<(cellPanelXY[1]+cellPanelWidthHeight[1]))
            ){
              Ispaces.logger.debug('draggable was dropped onto cellPanel '+cellPanel+', id = '+cellPanel.id);

              //Ispaces.dropObject=null;
              //_this.draggable=null;

              //// For some reason we are getting a double hit on panels. TBD.
              ////AsyncApply.exec(cellPanel.call);
              ////if(cellPanel.apply)cellPanel.apply.apply();
              ////cellPanel.dropFunction.apply(cellPanel.app,[globalDraggable.applicationp,cellPanel.index]);
              //cellPanel.dropFunction.apply(cellPanel.app,[globalDraggable,cellPanel]);
              ////cellPanel.ap.dropFunction.apply(cellPanel.application,[globalDraggable,cellPanel]);
              ////Ispaces.spaces.moveApp(globalDraggable.application,cellPanel.index); // If we only want to drop the app without switching.
              ////Ispaces.spaces.switchSpace(application,cellPanel.index); // If we want to switch the space after dropping the app.

              //_this.copy();
              //this.copy.bind(this);
              //this.copy();
              //this.copy(true);
              //this.copy(draggable.filePath,true);
              //this.drop(cellPanel,draggable.filePath);
              //this.drop(cellPanel,draggable);
              this.drop(
                draggable
                ,cellPanel
              );

              //Ispaces.logger.debug(this.id+'.mouseUp('+e+'): Ispaces.global.draggable=null;');
              Ispaces.global.draggable=null; // Reset the draggable to null after retrieving it... for the next drag. Only if the mouseUp() was handled.

              e.handled=true; // Set a custom flag on this event object, telling other event listeners that the event has been handled.

              //break;
              return true;
            }
          }
        }
      }
      */

      //Ispaces.draggable=null; // Reset the draggable to null after retrieving it... for the next drag.

    } // if(draggable)

    return false; // False - this mouseup event was not handles by this application/function.
  }

  ,dropFolder:function(
    draggable
    ,cellPanel
    ,folder
  ){
    Ispaces.logger.debug(this.id+'.dropFolder(draggable:'+draggable+', cellPanel:'+cellPanel+', folder:'+folder+')');

    /*
     * When dragging a file over a folder, the folder opens automatically by setting an asynchronous call.
     * If the drop happens before the folder opens, cancel the call.
     * @see folder.openFolderCall=new Ispaces.AsyncApply()
     */
    //Ispaces.logger.debug('folder.openFolderCall = '+folder.openFolderCall);
    if(folder.openFolderCall){
      //Ispaces.logger.debug('folder.openFolderCall.cancel()');
      folder.openFolderCall.cancel();
      folder.openFolderCall=null;
      delete folder["openFolderCall"];
    }

    this.drop(
      draggable
      ,cellPanel
      ,folder
    );
  }
  /*
   * End of drag & drop functionaity.
   */


  /*
   * Dialogs & Modals
   * Modal Windows e.g. Copy, Move, New Folder, Delete
   */

  /**
   * Creates a modal dialog.
   * @param draggable // the draggable element
   * @param cellPanel // the target cellPanel
   * @param folder    // the target folder being dropped on
   */
  ,drop:function(draggable,targetPanel,folder){
    Ispaces.logger.debug(this.id+'.drop(draggable:'+draggable+', targetPanel:'+targetPanel+', folder:'+folder+')');

    var _this=this;

    Ispaces.logger.debug('draggable.mouseDownElement = '+draggable.mouseDownElement);
    Ispaces.logger.debug('draggable.filePath = "'+draggable.filePath+'"');
    Ispaces.logger.debug('draggable.isDir = '+draggable.isDir);

    if(folder){ // a drop can be on a panel only, so a folder may not be available

      Ispaces.logger.debug('folder.filePath = "'+folder.filePath+'"');
      Ispaces.logger.debug('folder.isDir = '+folder.isDir);
      Ispaces.logger.debug('folder.listItem = '+folder.listItem);
      Ispaces.logger.debug('folder.fileElement = '+folder.fileElement);

      Ispaces.global.draggable.mouseUpElement=folder; // Set a reference to the folder on the global draggable, so the folder can be deselected after a drop. @see cancel()
    }

    var targetProtocol=targetPanel.protocol;
    Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');

    /*
     * from
     */
    var sourceFilePath=draggable.filePath
    ,lastIndexOfForwardSlash=sourceFilePath.lastIndexOf(_this.Constants.FORWARDSLASH)
    ,sourceFileName=sourceFilePath.substring(lastIndexOfForwardSlash+1)
    ;

    /*
     * to
     * Create the targetFilePath. Create the target URL.
     * Check for some 'to' indication first so we can display an error modal if there is no 'to'.
     */
    var sb=new Ispaces.StringBuilder();

    if(!folder){ // if there is no file/folder selected

      //var targetProtocol=targetPanel.protocol; // check for a cellPanel selected
      //Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');

      if(!targetProtocol){
        _this.error(Ispaces.getString('Please select a destination'));
        return;
      }else{
        sb.appendAll([targetProtocol,':/']);
      }

    }else{

      var filePath=folder.filePath;
      var isDir=folder.isDir;

      //Ispaces.logger.debug('filePath = "'+filePath+'"');
      //Ispaces.logger.debug('isDir = '+isDir);

      var FORWARDSLASH=_this.Constants.FORWARDSLASH;
      if(isDir){
        sb.appendAll([filePath,FORWARDSLASH]);
      }else{ // Get the parent directory name from the fileName
        var i=filePath.lastIndexOf(FORWARDSLASH);
        sb.append(filePath.substring(0,i+1));
      }

    }
    sb.append(sourceFileName);

    var targetFilePath=sb.asString();

    Ispaces.logger.debug('sourceFilePath = "'+sourceFilePath+'"');
    Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');

    Ispaces.logger.debug('draggable.application = '+draggable.application);
    Ispaces.logger.debug('draggable.cellPanel = '+draggable.cellPanel);

    var source=draggable.mouseDownElement
    ,sourceApplication=draggable.application
    ,sourcePanel=draggable.cellPanel
    //,sourceListItem=source.listItem
    ,sourceFileElement=source.fileElement
    ,sourceIsDir=source.isDir
    ,sourceIsLocal=source.isLocal
    ,sourceProtocol
    ;

    /* From move()
    var cellPanel=_this.cellPanel
    ,cellPanelPrevious=_this.cellPanelPrevious
    ;
    Ispaces.logger.debug('cellPanel = '+cellPanel);
    Ispaces.logger.debug('cellPanelPrevious = '+cellPanelPrevious);
    if(
      cellPanel
      &&cellPanelPrevious
    ){ // Make sure there are selected files/folders.
      modal.sourcePanel=cellPanel;
      modal.targetPanel=cellPanelPrevious;
    */

    /*
     * The modal, greyout layer, and centering table layer.
     */
    var modal=_this.copyModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.copyModal=_this.createCopyModal();
      resizableWindow.addModal(modal);
    }

    var filePath=draggable.filePath
    ,fileName=draggable.fileName
    //,cellPanel=draggable.cellPanel
    ,sourceProtocol
    ,mouseDownElement=draggable.mouseDownElement
    ;

    Ispaces.logger.debug('mouseDownElement = '+mouseDownElement);
    if(mouseDownElement)Ispaces.logger.debug('mouseDownElement.protocol = '+mouseDownElement.protocol);

    if(sourcePanel){

      Ispaces.logger.debug('sourcePanel = '+sourcePanel);
      Ispaces.logger.debug('sourcePanel.protocol = '+sourcePanel.protocol);
      modal.sourcePanel=sourcePanel;
      sourceProtocol=sourcePanel.protocol;
      sourcePanel.isLocal=sourceIsLocal;

    }else if(mouseDownElement){
      sourceProtocol=mouseDownElement.protocol;
    }

    modal.targetPanel=targetPanel;

    //Ispaces.logger.debug('source = '+source);
    //Ispaces.logger.debug('source.isDir = '+source.isDir);
    //Ispaces.logger.debug('source.isLocal = '+source.isLocal);
    //Ispaces.logger.debug('sourceApplication = '+sourceApplication);
    //Ispaces.logger.debug('sourcePanel = '+sourcePanel);
    //Ispaces.logger.debug('sourceFileElement = '+sourceFileElement);
    Ispaces.logger.debug('sourceIsDir = '+sourceIsDir);
    //Ispaces.logger.debug('sourceIsLocal = '+sourceIsLocal);
    //Ispaces.logger.debug('targetProtocol = '+targetProtocol);
    //Ispaces.logger.debug('sourceProtocol = '+sourceProtocol);

    //var isMove=(sourceProtocol==targetProtocol); // 'Move' removed for beta 2
    //Ispaces.logger.debug('isMove = '+isMove);

    /*
     * Set some references on the modal. @see okCopy()
     */
    if(sourceFileElement){
      //Ispaces.logger.debug('sourceFileElement.protocol = '+sourceFileElement.protocol);
      //Ispaces.logger.debug('sourceFileElement.filePath = '+sourceFileElement.filePath);
      //sourceIsDir=sourceFileElement.isDir;
      //Ispaces.logger.debug('sourceIsDir = '+sourceIsDir);

      _this.deselectFileElement(sourceFileElement); // Deselect the source file on drop?

      modal.sourceFileElement=sourceFileElement; // @see okCopy()
    }

    if(sourcePanel){
      //Ispaces.logger.debug('sourcePanel.protocol = '+sourcePanel.protocol);
      modal.sourcePanel=sourcePanel; // Set a reference to the source cellPanel. @see okCopy()
    }

    if(targetPanel)modal.targetPanel=targetPanel; // @see okCopy()

    //if(targetFileElement)modal.targetFileElement=targetFileElement; // @see okCopy()
    //if(folder)modal.targetFileElement=folder; // @see okCopy()
    if(folder){

      //var targetFileElement=folder.listItem;
      var targetFileElement=folder.fileElement;

      Ispaces.logger.debug('targetFileElement = '+targetFileElement);

      modal.targetFileElement=targetFileElement; // @see okCopy()
      //modal.targetFileElement=folder.listItem; // @see okCopy()
    }

    /*
    if(isMove){
      modal.rowButtonMove.show();
    }else{
      modal.rowButtonMove.hide();
    }
    //*/

    /*
     * from
     */
    var divSource=modal.divSource;

    //var char;
    //var extension
    //,mimeType
    //;

    if(sourceIsDir){

      divSource.setAttribute('type','folder');

      //extension='folder';
      //char='H';
      //mimeType=Ispaces.mimeTypes.getMimeType("folder");
      var extension='folder';
      Ispaces.logger.debug('divSource.setAttribute(\'ext\', "'+extension+'")');
      divSource.setAttribute('ext',extension);

    }else{

      /*
      var lastIndexOfDot=sourceFileName.lastIndexOf(Constants.Characters.DOT);
      Ispaces.logger.debug('lastIndexOfDot = '+lastIndexOfDot);

      if(lastIndexOfDot!=-1){
        extension=sourceFileName.substring(lastIndexOfDot+1);
      }else{
        extension='default';
      }
      */
      // Get the mime type icon.
      var extension=Ispaces.Launcher.getExtension(sourceFileName);
      Ispaces.logger.debug('extension = "'+extension+'"');

      //mimeType=Ispaces.mimeTypes.getMimeType(extension); // Check for the extension in our list of mimetypes. If the extension is not defined, this call returns the default ('') empty string mimetype.
      //Ispaces.logger.debug('mimeType = '+mimeType);

      /*
      char=Ispaces.MimeTypes.getChar(extension);
      //Ispaces.logger.debug('char = "'+char+'"');
      if(!char)char='a';
      */

      //Ispaces.logger.debug('divSource.setAttribute(\'type\', \'file\')');
      //divSource.setAttribute('type','file');

      Ispaces.logger.debug('divSource.setAttribute(\'ext\', "'+extension+'")');
      divSource.setAttribute('ext',extension);
    }

    divSource.replaceFirst(Common.Create.createTextNode(sourceFileName));

    //Ispaces.logger.debug('divSource.setAttribute(\'ext\', "'+extension+'")');
    //divSource.setAttribute('ext',extension);
    //divSource.setAttribute('char',char);
    //divSource.setAttribute('char','a');

    //divTile._className="tile-file "+extension;
    //divTile.setClass(divTile._className);
    //divTile.setAttribute('ext',extension); // This is used to set the unicode file icon. @see MimeTypes.getChar()


    /*
     * to
     */
    var divTarget=modal.divTarget;
    //divTarget.setAttribute('type','file');
    //divTarget.setAttribute('char',char);
    //divTarget.setAttribute('ext',extension);

    var a=targetFilePath.split(_this.Constants.COLON);
    var protocol=a[0];
    Ispaces.logger.debug('protocol = "'+protocol+'"');
    //divTarget.setAttribute('protocol',protocol);
    divTarget.replaceFirst(_this.Create.createTextNode(targetFilePath));

    // Set a reference to the sourceFilePath and targetFilePath on the modal.
    modal.sourceFilePath=sourceFilePath;
    modal.targetFilePath=targetFilePath;

    /*
     * show the modal
     */
    /*
    modal.moveCell.show();
    modal.show();
    centeringTable.show();
    */
    resizableWindow.showModal(modal);  // This will take care of showing the greyout layer as well as the modal. More OO approach.

    /*
     * Set the escape route. Set the escape function for the global escape catcher.
     */
    //modal.on=true;
    _this.modal=modal;

    /*
    var _this=this;
    modal.escape=function(){
      Ispaces.global.escapeKeyObject=null;
      Ispaces.global.escapeObject=null;
      resizableWindow.uncover();
      _this.cancel();
    };
    Ispaces.global.escapeKeyObject=modal;
    Ispaces.global.escapeObject=modal;
    */
    /*
     * The global 'click' handler escapes the drop.
     * Moving this setModalEscape() function to an asynchronous call, so the drop() function can return, before setting the escape mechanism.
     */
    /*
    new Ispaces.AsyncApply(
      this
      ,"setModalEscape"
      ,[
        modal
        ,resizableWindow
      ]
      ,100
    );
    */
  }

  ,setModalEscape:function(
    modal
    ,resizableWindow
  ){
    Ispaces.logger.debug(this.id+'.setModalEscape(modal:'+modal+', resizableWindow:'+resizableWindow+')');

    //var modal=this.modal;
    //var resizableWindow=this.resizableWindow;
    if(!resizableWindow)resizableWindow=_this.resizableWindow;

    var _this=this;
    modal.escape=function(){

      resizableWindow.uncover();
      _this.cancel();

      //Ispaces.global.escapeKeyObject=null;
      //Ispaces.global.escapeObject=null;
      Common.setEscapeKeyObject(null);
      Common.setEscapeObject(null);

      //return false;
    };

    //Ispaces.global.escapeKeyObject=modal;
    //Ispaces.global.escapeObject=modal;
    Common.setEscapeKeyObject(modal);
    Common.setEscapeObject(modal);
  }

  /*
   * Copy Modal
   */

  ,clickCopy:function(e){
    Ispaces.logger.debug(this.id+'.clickCopy('+e+')');

    Common.killEvent(e); // We have to kill the event, otherwise it closes the modal dialog.

    var _this=this
    ,sourcePanel=_this.cellPanel
    ,targetPanel=_this.cellPanelPrevious
    ,sourceFileElement
    ,targetFileElement
    ,sourceFilePath
    ,targetFilePath
    ,sourceIsDir
    ,targetIsDir
    ,sourceIsLocal
    ,sourceFileName
    ;

    var targetFilePathBuilder=new Ispaces.StringBuilder(); // Create the new target path...
    var FORWARDSLASH=_this.Constants.FORWARDSLASH;

    /*
    var sb=new Ispaces.StringBuilder();
    if(!folder){ // if there is no file/folder selected
      //var targetProtocol=targetPanel.protocol; // check for a cellPanel selected
      //Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
      if(!targetProtocol){
        _this.error(Ispaces.getString('Please select a destination'));
        return;
      }else{
        sb.appendAll([targetProtocol,':/']);
      }
    }else{
      var filePath=folder.filePath;
      var isDir=folder.isDir;
      //Ispaces.logger.debug('filePath = "'+filePath+'"');
      //Ispaces.logger.debug('isDir = '+isDir);
      if(isDir){
        sb.appendAll([filePath,_this.Constants.FORWARDSLASH]);
      }else{ // Get the parent directory name from the fileName
        var i=filePath.lastIndexOf(_this.Constants.FORWARDSLASH);
        sb.append(filePath.substring(0,i+1));
      }
    }
    sb.append(sourceFileName);
    var targetFilePath=sb.asString();
    Ispaces.logger.debug('sourceFilePath = "'+sourceFilePath+'"');
    Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
    */

    Ispaces.logger.debug('sourcePanel = '+sourcePanel);
    Ispaces.logger.debug('targetPanel = '+targetPanel);

    //if(sourcePanel){ // Is there a source panel selected?
    // Is there a source and target panels selected?
    if(
      sourcePanel
      &&targetPanel
    ){ // Make sure there are selected files/folders.

      sourceFileElement=sourcePanel.fileElement
      ,targetFileElement=targetPanel.fileElement
      ,sourceIsLocal=sourcePanel.sourceIsLocal
      ;

      Ispaces.logger.debug('sourceFileElement = '+sourceFileElement);
      Ispaces.logger.debug('targetFileElement = '+targetFileElement);
      Ispaces.logger.debug('sourceIsLocal = '+sourceIsLocal);

      if(sourceFileElement){

        sourceFilePath=sourceFileElement.filePath;
        sourceFileName=sourceFileElement.fileName;
        sourceIsDir=sourceFileElement.isDir;

        Ispaces.logger.debug('sourceFileName = '+sourceFileName);
        Ispaces.logger.debug('sourceFilePath = '+sourceFilePath);
        Ispaces.logger.debug('sourceIsDir = '+sourceIsDir);

      //}
      //if(!sourceFileElement){
      }else{
        _this.error(Ispaces.getString('Please select a file or folder to copy'));
        return;
      }

      if(targetFileElement){

        targetFilePath=targetFileElement.filePath;
        targetIsDir=targetFileElement.isDir;

        Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
        Ispaces.logger.debug('targetIsDir = '+targetIsDir);

        if(targetIsDir){
          targetFilePathBuilder.appendAll([targetFilePath,FORWARDSLASH,sourceFileName]);
        }else{
          var lastIndexOfForwardSlash=targetFilePath.lastIndexOf(FORWARDSLASH);
          targetFilePathBuilder.appendAll([
            targetFilePath.substring(0,(lastIndexOfForwardSlash+1))  // Get the parent directory name from the fileName
            ,sourceFileName
          ]);
        }

      }else{ // If there is no target folder. Check for a target panel/protocol.

        var targetProtocol=targetPanel.protocol; // check for a panel selected
        Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');

        if(!targetProtocol){
          this.error(Ispaces.getString('Please select a file or folder to copy'));
          return;
        }

        targetFilePathBuilder.appendAll([targetProtocol,':/',sourceFileName]);
      }

    }else{
      _this.error(Ispaces.getString('Please select a file or folder to copy'));
      return;
    }

    var modal=_this.copyModal
    ,resizableWindow=_this.resizableWindow
    ;
    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.copyModal=_this.createCopyModal(true);
      resizableWindow.addModal(modal);
    }

    // Create the new target path...
    targetFilePath=targetFilePathBuilder.asString();  // Override targetFilePath??
    Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
    var protocolAndPath=targetFilePath.split(_this.Constants.COLON);
    var targetProtocol=protocolAndPath[0];
    Ispaces.logger.debug('protocolAndPath = '+protocolAndPath);
    Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
    Ispaces.logger.debug('protocolAndPath[1] = "'+protocolAndPath[1]+'"');

    // References to the source and target panels
    modal.sourcePanel=sourcePanel;
    modal.targetPanel=targetPanel;
    modal.sourceFilePath=sourceFilePath;
    modal.targetFilePath=targetFilePath;

    // Update the dialog.
    modal.divSource.replaceFirst(_this.Create.createTextNode(sourceFileName));
    modal.divTarget.replaceFirst(_this.Create.createTextNode(targetFilePath));
    modal.divTarget.setAttribute('type','file');

    //var extension
    //,mimeType
    //;

    if(sourceIsDir){

      modal.divSource.setAttribute('type','folder');  // @see css/MimeTypes.jso

      //extension='folder';
      //mimeType=Ispaces.mimeTypes.getMimeType("folder");

    }else{

      // Get the mime type icon.
      var extension=Ispaces.Launcher.getExtension(sourceFileName);
      Ispaces.logger.debug('extension = "'+extension+'"');

      //mimeType=Ispaces.mimeTypes.getMimeType(extension); // Check for the extension in our list of mimetypes. If the extension is not defined, this call returns the default ('') empty string mimetype.
      //Ispaces.logger.debug('mimeType = '+mimeType);

      Ispaces.logger.debug('modal.divSource.setAttribute(\'ext\', "'+extension+'")');
      modal.divSource.setAttribute('ext',extension);

      //Ispaces.logger.debug('divSource.setAttribute(\'type\', \'file\')');
      //divSource.setAttribute('type','file');
    }

    resizableWindow.showModal(modal);

    _this.modal=modal;
  }

  ,createModal:function(){
    Ispaces.logger.debug(this.id+'.createModal()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,closeButton=createDiv(Create.createTextNode('U')).setClass("closebutton")
    ,cellClose=createDiv(closeButton)
    ,rowClose=createDiv(cellClose)
    ,tableClose=createDiv(rowClose)
    ,divClose=createDiv(tableClose)
    ;

    closeButton.addListener(_this.Events.MOUSEDOWN,_this.clickCloseModal.bind(_this));

    return createDiv(divClose).setClass("Dialog");
  }
  ,createModalBak:function(){
    Ispaces.logger.debug(this.id+'.createModal()');

    /*
    var cellClose=this.Create.createDivCell(buttonClose).setClass('closecell');
    var rowClose=this.Create.createDivRow(cellClose).setClass('closerow');
    var tableClose=this.Create.createDivTable(rowClose).setClass('closetable');
    var divClose=this.Create.createDivTable(tableClose).setClass('closediv');

    //cellClose.setMargin('0'),cellClose.setPadding('0'),cellClose.setHeightPixels(1);
    //rowClose.setMargin('0'),rowClose.setPadding('0'),rowClose.setHeightPixels(1);
    //tableClose.setMargin('0'),tableClose.setPadding('0'),tableClose.setHeightPixels(1);
    */

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv

    ,buttonClose=createDiv(Create.createTextNode('U')).setClass("closebutton")
    ,cellClose=createDiv(buttonClose)
    ,rowClose=createDiv(cellClose)
    ,tableClose=createDiv(rowClose)
    ,divClose=createDiv(tableClose)
    ;

    buttonClose.addListener(
      _this.Events.MOUSEDOWN
      ,_this.clickCloseModal.bind(_this)
    );

    return createDiv(divClose).setClass("modal");
  }

  ,clickCloseModal:function(e){
    Ispaces.logger.debug(this.id+'.clickCloseModal('+e+')');

    //this.hideModal();
    this.cancel();

    //Common.stopEventPropagation(e);
    Common.killEvent(e);

    /*
     * Unset the global escape objects.
     */
    //Ispaces.global.escapeKeyObject=null; // Unset the global escapeKeyObject
    //Ispaces.global.escapeObject=null; // Unset the global escapeObject
    Common.setEscapeKeyObject(null);
    Common.setEscapeObject(null);
  }

  ,cancel:function(){
    Ispaces.logger.debug(this.id+'.cancel()');

    Ispaces.logger.debug('Ispaces.global.draggable = '+Ispaces.global.draggable);

    var draggable=Ispaces.global.draggable;
    if(draggable){
    Ispaces.logger.debug('draggable = '+draggable);

      Ispaces.logger.debug('Ispaces.global.draggable.mouseUpElement = '+Ispaces.global.draggable.mouseUpElement);
      var target=Ispaces.global.draggable.mouseUpElement;
      Ispaces.logger.debug('target = '+target);

      Ispaces.logger.debug('Ispaces.global.draggable.mouseDownElement = '+Ispaces.global.draggable.mouseDownElement);
      var source=Ispaces.global.draggable.mouseDownElement;
      Ispaces.logger.debug('source = '+source);

      if(target){

        /*
        var targetListItem=target.listItem;
        Ispaces.logger.debug('targetListItem = '+targetListItem);
        // Deselect the target file.
        this.deselectFileElement(targetListItem);
        */
        var targetFileElement=target.fileElement;
        Ispaces.logger.debug('targetFileElement = '+targetFileElement);
        Ispaces.logger.info('Deselect the target file. This does not work. The file should be deselected.');
        //if(targetFileElement)this.deselectFileElement(targetFileElement); // Deselect the target file. This does not work. The file should be deselected.
      }

      if(source){

        /*
        var sourceListItem=source.listItem;
        //Ispaces.logger.debug('sourceListItem = '+sourceListItem);
        if(sourceListItem){ // TBD - there is no sourceListItem when a file is being dragged from the desktop.
          // Deselect the source file.
          this.deselectFileElement(sourceListItem);
        }else{
          Ispaces.logger.warn(this.id+'.cancel(): TBD - there is no sourceListItem when a file is being dragged from the desktop.');
        }
        */

        var sourceFileElement=source.fileElement;
        //Ispaces.logger.debug('sourceFileElement = '+sourceFileElement);
        if(sourceFileElement){ // TBD - there is no sourceFileElement when a file is being dragged from the desktop.
          // Deselect the source file.
          this.deselectFileElement(sourceFileElement);
        }else{
          Ispaces.logger.warn(this.id+'.cancel(): TBD - there is no sourceFileElement when a file is being dragged from the desktop.');
        }

      }
    }

    /*
    this.modal.hide();
    //this.modalCenteringTable.hide();
    this.greyout.hide();
    */
    //Ispaces.logger.alert(this.id+'.cancel(): this.modal.input = '+this.modal.input);
    this.hideModal();
    //this.resizableWindow.hideModal(this.modal);
    //this.modal.escape();

    //this.modal.input.value=this.Constants.EMPTY;
    this.modal=null;
  }

  ,hideModal:function(){
    Ispaces.logger.debug(this.id+'.hideModal()');

    //if(this.spinner)this.spinner.stop(); // Moved to copied()

    /*
    var modal=this.modal;
    if(modal){
      modal.on=false;
      modal.hide();
      //modal.cancel();
      //modal.escape();
      //this.modal=null;
    }

    this.resizableWindow.uncover();
    */
    this.resizableWindow.hideModal(this.modal);

    this.modal=null;  // Unset the reference to the active modal.

    //this.divApplication.setHeightPixels(this.divApplication.widthHeight[1]);
    //Ispaces.logger.alert(this.id+'.newFolder(): Common.unsetWidthHeight(this.divApplication)');
    //Common.unsetWidthHeight(this.divApplication); // After we reset the height of the addDiv, we unset it again so that it does not upset any resizing.
  }

  ,createCopyModal:function(){
    Ispaces.logger.debug(this.id+'.createCopyModal()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    ,createDivTable=Create.createDivTable
    //,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n
    ,CLICK=_this.Events.CLICK // this["Constants"]
    ,PX=Constants.Strings.PX // window["Constants"]
    ;

    var modal=_this.createModal();

    var divCopy=Create.createDiv(Create.createTextNodeI18n("Copy")).setClass("txt")
    ,cellCopy=Create.createDivCell(divCopy).setClass("txt-cell")
    ,rowCopy=Create.createDivRow(cellCopy)
    ;

    var divTo=Create.createDiv(Create.createTextNodeI18n("To")).setClass("txt")
    ,cellTo=Create.createDivCell(divTo).setClass("txt-cell")
    ,rowTo=Create.createDivRow(cellTo)
    ;

    var divSource=Create.createDiv().setClass("from-file")
    ,cellSource=Create.createDivCell(divSource).setClass("cell-file")
    ,rowSource=Create.createDivRow(cellSource)
    ;

    var divTarget=Create.createDiv().setClass("to-file")
    ,cellTarget=Create.createDivCell(divTarget).setClass("cell-file")
    ,rowTarget=Create.createDivRow(cellTarget)
    ;
    /*
    var divCopy=createDiv(createTextNodeI18n("Copy")).setClass("txt")
    ,cellCopy=createDivCell(divCopy).setClass("txt-cell")
    ,rowCopy=createDivRow(cellCopy)
    ;

    var divTo=createDiv(createTextNodeI18n("To")).setClass("txt")
    ,cellTo=createDivCell(divTo).setClass("txt-cell")
    ,rowTo=createDivRow(cellTo)
    ;

    var divSource=createDiv().setClass("from-file")
    ,cellSource=createDivCell(divSource).setClass("file-cell")
    ,rowSource=createDivRow(cellSource)
    ;

    var divTarget=createDiv().setClass("from-file")
    ,cellTarget=createDivCell(divTarget).setClass("file-cell")
    ,rowTarget=createDivRow(cellTarget)
    ;
    */

    var buttonCopy=createDiv(createTextNodeI18n("Copy")).setClass("button")
    ,cellButtonCopy=createDivCell(buttonCopy).setClass("button-cell")
    ,rowButtonCopy=createDivRow(cellButtonCopy)
    ;

    /* Move temporarily removed for beta 2
    var buttonMove=createDiv(createTextNodeI18n("Move")).setClass("button")
    ,cellMove=createDivCell(buttonMove).setClass("button-cell")
    ,rowButtonMove=createDivRow(cellMove)
    ;
    */

    var divButtons=createDivTable([
      rowButtonCopy
      //,rowButtonMove  // Move temporarily removed for beta 2
    ]).setClass("buttons");

    var divTable=createDivTable([
      rowCopy
      ,rowSource
      ,rowTo
      ,rowTarget
      ,divButtons
    ]).setClass("inner");

    modal.add(divTable);

    // Set references to the 'from' and 'to' div.
    modal.divSource=divSource;
    modal.divTarget=divTarget; // @see clickCopy() - copyModal.divTarget
    //modal.moveCell=cellMove; // @see clickCopy() - copyModal.divTarget  // Moved temporarily removed for beta 2.
    //modal.rowButtonMove=rowButtonMove; // @see clickCopy() - copyModal.divTarget

    var CLICK=_this.Events.CLICK;
    buttonCopy.addListener(CLICK,_this.okCopy.bind(_this,modal));
    //buttonMove.addListener(CLICK,_this.okMove.bind(_this,modal));

    // Prevent the mousedown (on the modal) from closing the modal. Mousedown on the greyout area will escape/close the modal.
    modal.addListener(_this.Events.MOUSEDOWN,function(e){
      Common.stopEventPropagation(e);
      //Common.killEvent(e);
    });

    //modal.escapeKey=function(){
    //  _this.hideModal();
    //};
    modal.escapeKey=this.hideModal.bind(_this);

    /*
    modal.enterKey=function(e){
      Ispaces.logger.debug('modal.enterKey('+e+')');
      Ispaces.logger.debug('modal.sourcePanel = '+modal.sourcePanel+', modal.targetPanel = '+modal.targetPanel);
      Ispaces.logger.debug('this.sourcePanel = '+this.sourcePanel+', this.targetPanel = '+this.targetPanel);
      Ispaces.logger.debug('modal.sourceListItem = '+modal.sourceListItem+', modal.targetListItem = '+modal.targetListItem);
      Ispaces.logger.debug('this.sourceListItem = '+this.sourceListItem+', this.targetListItem = '+this.targetListItem);
      Ispaces.logger.debug('this.sourceFilePath = "'+this.sourceFilePath+'", this.targetFilePath = "'+this.targetFilePath+'"');
      Ispaces.logger.debug('modal.sourceFilePath = "'+modal.sourceFilePath+'", modal.targetFilePath = "'+modal.targetFilePath+'"');
      _this.okCopy(modal);
    };
    //modal.sourceFilePath=sourceFilePath;
    //modal.targetFilePath=targetFilePath;
    */
    modal.enterKey=_this.okCopy.bind(_this,modal);

    return modal;
  }
  /*
  ,createCopyModalNew:function(isDrop){
    Ispaces.logger.debug(this.id+'.createCopyModal(isDrop:'+isDrop+')');

    var _this=this
    ,Create=_this.Create
    ,modal=_this.createModal()
    ;

    var divCopy=Create.createDiv(Create.createTextNodeI18n("Copy")).setClass("txt")
    ,cellCopy=Create.createDivCell(divCopy).setClass("txt-cell")
    ,rowCopy=Create.createDivRow(cellCopy)
    ;

    var divTo=Create.createDiv(Create.createTextNodeI18n("To")).setClass("txt")
    ,cellTo=Create.createDivCell(divTo).setClass("txt-cell")
    ,rowTo=Create.createDivRow(cellTo)
    ;

    var divSource=Create.createDiv().setClass("from-file")
    ,cellSource=Create.createDivCell(divSource).setClass("cell-file")
    ,rowSource=Create.createDivRow(cellSource)
    ;

    var divTarget=Create.createDiv().setClass("from-file")
    ,cellTarget=Create.createDivCell(divTarget).setClass("cell-file")
    ,rowTarget=Create.createDivRow(cellTarget)
    ;

    // Set references to the 'from' and 'to'/'target' divs.
    modal.divSource=divSource;
    modal.divTarget=divTarget; // @see copy() - copyModal.divTarget

    var buttonCopy=Create.createDiv(Create.createTextNodeI18n("Copy")).setClass("button")
    ,cellButtonCopy=Create.createDivCell(buttonCopy).setClass("button-cell")
    ,rowButtonCopy=Create.createDivRow(cellButtonCopy)
    ;

    //buttonCopy.addListener(Constants.Events.CLICK,_this.okCopy.bind(_this,modal));
    var CLICK=_this.Events.CLICK;
    buttonCopy.addListener(CLICK,_this.okCopy.bind(_this,modal));

    // Prevent the mousedown (on the modal) from closing the modal. Mousedown on the greyout area will escape/close the modal.
    modal.addListener(_this.Events.MOUSEDOWN,function(e){
      Common.stopEventPropagation(e);
      //Common.killEvent(e);
    });

    if(isDrop){

      var buttonMove=Create.createDiv(Create.createTextNodeI18n("Move")).setClass("button")
      ,cellMove=Create.createDivCell(buttonMove).setClass("button-cell")
      ,rowMove=Create.createDivRow(cellMove)
      ;

      modal.moveCell=cellMove; // @see copy() - copyModal.divTarget
      //buttonMove.addListener(Constants.Events.CLICK,_this.okMove.bind(_this,modal));
      buttonMove.addListener(CLICK,_this.okMove.bind(_this,modal));
    }

    var divButtons=Create.createDivTable([
      rowButtonCopy
      ,rowMove
    ]).setClass("buttons");

    divButtons.setPaddingTop('8px');

    var divTable=Create.createDivTable([
      rowCopy
      ,rowSource
      ,rowTo
      ,rowTarget
      ,divButtons
    ]).setClass("inner");

    modal.add(divTable);

    //modal.escapeKey=_this.hideModal.bind(_this); // Temporarily removed.
    //modal.enterKey=_this.okCopy.bind(_this,modal); // Temporarily removed.

    return modal;
  }
  */

  ,okModal:function(){
    Ispaces.logger.debug(this.id+'.okModal()');

    //this.modalCenteringTable.hide();
    //this.modal.hide();
    //this.modal.on=false;
    //this.greyout.hide();
    //this.hideModal();
    this.resizableWindow.hideModal(this.modal);
  }

  ,okCopy:function(modal){
    Ispaces.logger.debug(this.id+'.okCopy('+modal+')');

    /*
     * Create the progress modal after a timeout period.
     */
    //Common.asyncCall(this,"progress",this.PROGRESS_WAIT);
    this.progressCall=new Ispaces.AsyncCall(this,this.progress,this.PROGRESS_WAIT);

    Ispaces.logger.debug('modal.sourceApplication = '+modal.sourceApplication);
    Ispaces.logger.debug('modal.sourcePanel = '+modal.sourcePanel);
    Ispaces.logger.debug('modal.targetPanel = '+modal.targetPanel);
    /*
    Ispaces.logger.debug('modal.sourcePanel.isLocal = '+modal.sourcePanel.isLocal);
    Ispaces.logger.debug('modal.sourcePanel.filePath = '+modal.sourcePanel.filePath);
    Ispaces.logger.debug('modal.targetPanel.isLocal = '+modal.targetPanel.isLocal);
    Ispaces.logger.debug('modal.targetPanel.filePath = '+modal.targetPanel.filePath);
    //*/

    var sourceFilePath=modal.sourceFilePath
    ,sourcePanel=modal.sourcePanel
    ,targetPanel=modal.targetPanel
    ,targetFilePath=modal.targetFilePath
    ,targetFileElement=modal.targetFileElement
    ,sourceIsLocal=false
    ,targetIsLocal=targetPanel.isLocal
    ;

    var FORWARDSLASH=this.Constants.FORWARDSLASH;

    var lastIndexOfFileSeparator=sourceFilePath.lastIndexOf(FORWARDSLASH);
    var fileName=sourceFilePath.substring(lastIndexOfFileSeparator+1);
    lastIndexOfFileSeparator=targetFilePath.lastIndexOf(FORWARDSLASH);
    targetFilePath=targetFilePath.substring(0,lastIndexOfFileSeparator+1)+fileName;

    if(sourcePanel){
      sourceIsLocal=sourcePanel.isLocal
    }

    Ispaces.logger.debug('sourcePanel = '+sourcePanel);
    Ispaces.logger.debug('targetPanel = '+targetPanel);
    Ispaces.logger.debug('sourceFilePath = "'+sourceFilePath+'"');
    Ispaces.logger.debug('fileName = "'+fileName+'"');
    Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
    Ispaces.logger.debug('sourceIsLocal = '+sourceIsLocal);
    Ispaces.logger.debug('targetIsLocal = '+targetIsLocal);
    Ispaces.logger.debug('targetFileElement = '+targetFileElement);

    /* For UI development, send back a dummy response.
    var copyObject={
      'f':sourceFilePath
      ,'t':targetFilePath
      ,sourcePanel:sourcePanel
      ,targetPanel:targetPanel
    };

    // The progress spinner is delayed for 1 second so that "quick" copys do not get the progress modal.
    //Common.asyncApply(this,"copied",['1',copyObject],3333); // Immitate a medium size file. 3 seconds.
    Common.asyncApply(this,"copied",['1',copyObject],333);    // Immitate a small "quick" copy file. .3 seconds.
    return;
    //*/

    if(sourceIsLocal){ // Copy a local file,
      if(targetIsLocal){ // 1) Copy a local file to a local file.
        Ispaces.logger.debug('sourceIsLocal && targetIsLocal');

        var copied=Ispaces.Files.copyFile({f:sourceFilePath,t:targetFilePath});
        Ispaces.logger.debug('copied = '+copied);

        this.copied(
          copied?1:0
          ,{
            'f':sourceFilePath
            ,'t':targetFilePath
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceListItem:sourceListItem
            ,targetFileElement:targetFileElement
          }
        );

      }else{         // 2) Copy a local file to a remote file.
        Ispaces.logger.debug('sourceIsLocal && !targetIsLocal');

        var _this=this;

        var callback=function(copied){
          Ispaces.logger.debug('callback(copied:'+copied+')');

          _this.copied(
            copied?1:0
            ,{
              'f':sourceFilePath
              ,'t':targetFilePath
              ,sourcePanel:sourcePanel
              ,targetPanel:targetPanel
              //,sourceListItem:sourceListItem
              ,targetFileElement:targetFileElement
            }
          );
        };

        var args={
          f:sourceFilePath
          ,t:targetFilePath
          ,callback:callback
        };

        /*
         * Even though this is an Asynchronous call, the applet hangs until the method returns... need to add this to a separate thread and provide a callback, so that the UI is not held up.
         */
        new Ispaces.AsyncApply(
          Ispaces.Files
          ,"upload"
          ,[args]
          ,100
        );

      }

    }else{ // Copy a remote file,
      if(targetIsLocal){ // 1) Copy a remote file to a local file (Downloading)
        Ispaces.logger.debug('!sourceIsLocal && targetIsLocal');

        /*
        var _size=this.leftRight._size; // Get the size for efficient buffering.
        Ispaces.logger.debug(this.id+'.okCopy(): _size = '+_size);

        //new Ispaces.Ajax(Ispaces.contextPath+'/upload',function(r){Ispaces.logger.alert(r)}).upload({f:sourceFilePath,t:targetFilePath}); // Where we have multiple files being copied the sourceFilePath object can be an array for file URLs.
        var copied=phoneCommander.download({f:sourceFilePath,t:targetFilePath,s:_size});
        Ispaces.logger.debug(this.id+'.okCopy(): copied = '+copied);
        var o={
          'f':sourceFilePath
          ,'t':targetFilePath
        };
        this.copied(copied,o);
        */
        var copied=Ispaces.Files.download({f:sourceFilePath,t:targetFilePath});
        //Ispaces.logger.debug('copied = '+copied);

        this.copied(
          copied?1:0
          ,{
            'f':sourceFilePath
            ,'t':targetFilePath
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceListItem:sourceListItem
            ,targetFileElement:targetFileElement
          }
        );

      }else{          // 2) Copy a remote file to a remote file. Remote rename operation.
        Ispaces.logger.debug('!sourceIsLocal && !targetIsLocal');

        var callback={
          "_this":this
          ,"functionName":"copied"
          ,"args":{
            'f':sourceFilePath
            ,'t':targetFilePath
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceListItem:sourceListItem
            ,targetFileElement:targetFileElement
          }
        };

        new Ispaces.Ajax(Ispaces.contextUrl+'/copy',callback).send({f:sourceFilePath,t:targetFilePath}); // Where we have multiple files being copied the sourceFilePath object can be an array for file URLs.

        /*
        var filePath=new Ispaces.StringBuilder([
          Ispaces.contextPath
          ,'/copy'
          ,'?f=',encodeURIComponent(sourceFilePath)
          ,'&t=',encodeURIComponent(targetFilePath)
        ]).asString();
        Ispaces.logger.alert('!sourceIsLocal && !targetIsLocal: filePath = '+filePath);

        new Ispaces.Ajax(
          filePath
          ,callback
        ).doGet();
        */

      }
    }
  }

  ,copied:function(r,config){
    Ispaces.logger.debug(this.id+'.copied('+r+', '+config+')');
    //Ispaces.logger.alert(this.id+'.copied('+r+', '+config+')');

    /*
     * Cancel the progress.
     */
    Ispaces.logger.debug('this.progressCall = '+this.progressCall);
    if(this.progressCall){
      this.progressCall.cancel();
      this.progressCall=null;
    }

    /*
     * If there was a progress spinner, stop it.
     */
    if(this.spinner)this.spinner.stop();

    Ispaces.logger.debug('config.f = "'+config.f+'"');
    Ispaces.logger.debug('config.t = "'+config.t+'"');

    // source and target panels
    var sourcePanel=config.sourcePanel
    ,targetPanel=config.targetPanel
    ;

    Ispaces.logger.debug('sourcePanel = '+sourcePanel);
    Ispaces.logger.debug('targetPanel = '+targetPanel);
    //Ispaces.logger.debug('sourcePanel.protocol = '+sourcePanel.protocol);
    //Ispaces.logger.debug('targetPanel.protocol = '+targetPanel.protocol);

    this.hideModal();
    //this.resizableWindow.hideModal(this.modal);

    //Ispaces.logger.debug('typeof r = '+typeof r);

    //var copied=parseInt(r)||r=='true';
    //Ispaces.logger.debug('copied = '+copied);

    var sound;

    if(parseInt(r)){
    //if(copied){

      sound="copy";

      var from=config.f,to=config.t;

      //var panelIndex=config.panelIndex,panelIndexPrev=config.panelIndexPrev;
      //Ispaces.logger.debug('panelIndex = '+panelIndex+', panelIndexPrev = '+panelIndexPrev);
      //var sourcePanel=config.sourcePanel,targetPanel=config.targetPanel;
      //Ispaces.logger.debug('sourcePanel = '+sourcePanel+', targetPanel = '+targetPanel);

      /*
      var fileMap=files.copy(protocol,path);
      var fileTable=this.createTableFiles(protocol,parentNameAndPath[1],fileMap,this.cellFiles); // Create the new file table.
      this.cellFiles.replaceFirst(fileTable); // Replace the old file table with the new one.
      this.mouseDownTableRow(null,fileTable.tbody.firstChild,this.cellFiles); // Simulate the mouse down on the first row, to select it.
      this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
      */

      var a=from.split(this.Constants.COLON)
      ,sourceProtocol=a[0]
      ,sourceFilePath=a[1]
      ;
      Ispaces.logger.debug('sourceProtocol = '+sourceProtocol+', sourceFilePath = '+sourceFilePath);

      a=to.split(this.Constants.COLON)
      ,targetProtocol=a[0]
      ,targetFilePath=a[1]
      ;
      Ispaces.logger.debug('targetProtocol = '+targetProtocol+', targetFilePath = '+targetFilePath);

      /*
      var copyFile=Ispaces.Files.get(this.root,sourceFilePath);
      Ispaces.logger.debug('copyFile = '+copyFile);
      var protocolAndPath=config.t.split(this.Constants.COLON);
      var protocol=protocolAndPath[0];
      var path=protocolAndPath[1];
      var parentNameAndPath=this.getParentNameAndPath(path);

      Ispaces.logger.debug('protocol = '+protocol+', path = '+path);
      */

      /*
      var leftRight=this.leftRight==this.left?this.right:this.left;
      var cellFiles=this.cellFiles==this.leftDivFiles?this.rightDivFiles:this.leftDivFiles;
      //var filePath=leftRight.filePath;

      var fileMap=files.create(protocol,path,copyFile);
      var fileUnorderedList=this.createFileUnorderedList(this.root,parentNameAndPath[1],fileMap,cellFiles); // Create the new file listing.
      cellFiles.replaceFirst(fileUnorderedList); // Replace the old file listing with the new one.
      this.mouseDownTableRow(null,fileUnorderedList.firstChild,cellFiles); // Simulate the mouse down on the first row, to select it.
      //this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
      */

      Ispaces.spaces.getSpace().desktop.refresh(); // Do we need the refresh the current desktop?

      // Refresh the target file element.
      var targetFileElement=config.targetFileElement;
      Ispaces.logger.debug('targetFileElement = '+targetFileElement);

      //*
      if(targetFileElement){
        //Ispaces.logger.debug('targetFileElement.filePath = '+targetFileElement.filePath);
        //Ispaces.logger.debug('targetFileElement.parentUnorderedList = '+targetFileElement.parentUnorderedList);
        //Ispaces.logger.debug('targetFileElement.parentUnorderedList.listItem = '+targetFileElement.parentUnorderedList.listItem);
        //if(targetFileElement.parentUnorderedList.listItem)Ispaces.logger.debug('targetFileElement.parentUnorderedList.listItem.filePath = '+targetFileElement.parentUnorderedList.listItem.filePath);
        //if(!targetFileElement.isDir)targetFileElement=targetFileElement.parentUnorderedList.listItem;
        if(!targetFileElement.isDir)targetFileElement=targetFileElement.parentUnorderedList.fileElement;
      }

      if(targetFileElement){
        this.refreshListItem(targetFileElement,targetPanel);
      }else{
        this.refreshPanel(targetPanel);
      }

      //*/
      //this.refreshPanel(targetPanel);

    }else{
      sound="access-denied";
    }

    Ispaces.Sounds.play(sound);
  }


  /*
   * Progress Modal
   */

  ,progress:function(
    e
    //sourcePanel
  ){
    Ispaces.logger.debug(this.id+'.progress('+e+')');

    if(e)Common.killEvent(e); // We have to kill the event, otherwise it closes the modal

    //_this.cancel(); // ?? Removed

    var _this=this
    ,modal=_this.progressModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.progressModal=_this.createProgressModal();
      resizableWindow.addModal(modal);
    }

    _this.spinner.start();

    //modal.show();
    //centeringTable.show();
    resizableWindow.showModal(modal);  // This will take care of showing the greyout layer as well as the modal. More OO approach.

    //modal.on=true;
    _this.modal=modal;

    /*
    new Ispaces.AsyncCall( // We have to asynchronously set the escape as the mouseup escapes this.
      null
      ,function(){
        //Ispaces.logger.debug('Ispaces.AsyncCall(): Ispaces.global.escapeKeyObject=modal;');
        Ispaces.global.escapeKeyObject=modal; // escape key
        Ispaces.global.escapeObject=modal; // escape click
      }
      ,100
    );
    */
  }

  ,createProgressModal:function(){
    Ispaces.logger.debug(this.id+'.createProgressModal()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    //,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n

    // Be careful here... with local constants and global constants. this.Constants Vs window.Constants
    ,CLICK=_this.Events.CLICK // this["Constants"]
    ,PX=Constants.Strings.PX  // window["Constants"]
    ;

    //var modal=this.createModal();
    var modal=createDiv().setClass("Dialog");

    /*
    modal.escape=function(){
      Ispaces.logger.debug(_this.id+'.createProgressModal(): modal.escape()');
      //Ispaces.svg.stop();
      _this.spinner.stop();
      _this.hideModal();
      Ispaces.global.escapeKeyObject=null;
      Ispaces.global.escapeObject=null;
    };

    modal.enterKey=function(e){
      Ispaces.logger.debug(_this.id+'.createProgressModal(): modal.enterKey('+e+')');
      this.escape();
    };
    //*/

    /*
    var buttonClose=modal.buttonClose;
    buttonClose.addListener(
      this.Events.MOUSEDOWN
      //,function(e){
      //  Common.stopEventPropagation(e);
      //}
      ,modal.escape
      ,false
    );
    */

    /*
    var uploadingTxt=this.Create.createDiv(this.Create.createTextNode('Progress...')).setClass('txt')
    ,uploadingTxtCell=this.Create.createDivCell(uploadingTxt).setClass('txt-cell')
    ,uploadingTxtRow=this.Create.createDivRow(uploadingTxtCell)
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

    var spinner=new Ispaces.Spinner(
      innerRadius
      ,outerRadius
      ,spokeCount
      ,strokeWidth
      ,color
      ,frequency // in milliseconds
    );

    this.spinner=spinner; // Set a local reference to the newly created spinner, so we can start and stop the spinner.

    //var svg=document.createElementNS('http://www.w3.org/2000/svg',Constants.Tags.SVG);
    //var svg=document.createElementNS(Constants.Paths.SVG,Constants.Tags.SVG);
    //var svg=Common.createElementNS(Constants.Paths.SVG,Constants.Tags.SVG);
    var svg=spinner.svg;
    Ispaces.logger.debug('svg = '+svg);

    //var svgWidth=((outerRadius*2)+(strokeWidth*2));
    //var svgWidth=spinner.getWidth();
    var svgWidth=spinner.width;
    Ispaces.logger.debug('svgWidth = '+svgWidth);

    //svg.setAttributeNS(null,'width',svgWidth);
    //svg.setAttributeNS(null,'height',svgWidth);
    svg.width.baseVal.valueAsString=svgWidth+PX;
    svg.height.baseVal.valueAsString=svgWidth+PX;
    svg.width.baseVal.value=svgWidth;
    svg.height.baseVal.value=svgWidth;

    var divSpinner=createDiv(svg)
    ,cellSpinner=createDivCell(divSpinner)
    ,rowSpinner=createDivRow(cellSpinner)
    ;

    divSpinner.setPadding('10px');
    divSpinner.alignCenterMiddle();
    cellSpinner.alignCenterMiddle();
    //cellSpinner.setPadding('10px');
    //divSpinner.setBorder(Constants.Borders.RED);
    //cellSpinner.setBorder(Constants.Borders.BLACK);

    /*
    var divClose=createDiv(createTextNodeI18n("Close")).setClass("button")
    ,cellClose=createDivCell(divClose).setClass("button-cell")
    ,rowClose=createDivRow(cellClose)
    ;

    divClose.addListener(
      //this.Events.CLICK
      this.Events.MOUSEDOWN
      ,modal.escape
      //,false
      ,true
    );

    var divButtons=this.Create.createDivTable(rowClose).setClass("buttons");
    */

    var divTable=this.Create.createDivTable([
      //uploadingTxtRow
      rowSpinner
      //,divButtons
    ]).setClass("inner");

    modal.add(divTable);

    return modal;
  }


  /*
   * Move Modal
   */

  ,clickMove:function(e){
    Ispaces.logger.debug(this.id+'.clickMove('+e+')');

    Common.killEvent(e); // We have to kill the event, otherwise it closes the modal dialog.

    var _this=this
    ,sourcePanel=_this.cellPanel
    ,targetPanel=_this.cellPanelPrevious
    ,sourceFileElement
    ,targetFileElement
    ,sourceFilePath
    ,targetFilePath
    ,sourceIsDir
    ,targetIsDir
    ,sourceIsLocal
    ,sourceFileName
    ;

    var targetFilePathBuilder=new Ispaces.StringBuilder(); // Create the new target path...
    var FORWARDSLASH=_this.Constants.FORWARDSLASH;

    /*
    var sb=new Ispaces.StringBuilder();
    if(!folder){ // if there is no file/folder selected
      //var targetProtocol=targetPanel.protocol; // check for a cellPanel selected
      //Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
      if(!targetProtocol){
        _this.error(Ispaces.getString('Please select a destination'));
        return;
      }else{
        sb.appendAll([targetProtocol,':/']);
      }
    }else{
      var filePath=folder.filePath;
      var isDir=folder.isDir;
      //Ispaces.logger.debug('filePath = "'+filePath+'"');
      //Ispaces.logger.debug('isDir = '+isDir);
      if(isDir){
        sb.appendAll([filePath,_this.Constants.FORWARDSLASH]);
      }else{ // Get the parent directory name from the fileName
        var i=filePath.lastIndexOf(_this.Constants.FORWARDSLASH);
        sb.append(filePath.substring(0,i+1));
      }
    }
    sb.append(sourceFileName);
    var targetFilePath=sb.asString();
    Ispaces.logger.debug('sourceFilePath = "'+sourceFilePath+'"');
    Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
    */

    Ispaces.logger.debug('sourcePanel = '+sourcePanel);
    Ispaces.logger.debug('targetPanel = '+targetPanel);

    //if(sourcePanel){ // Is there a source panel selected?
    // Is there a source and target panels selected?
    if(
      sourcePanel
      &&targetPanel
    ){ // Make sure there are selected files/folders.

      sourceFileElement=sourcePanel.fileElement
      ,targetFileElement=targetPanel.fileElement
      ,sourceIsLocal=sourcePanel.sourceIsLocal
      ;

      Ispaces.logger.debug('sourceFileElement = '+sourceFileElement);
      Ispaces.logger.debug('targetFileElement = '+targetFileElement);
      Ispaces.logger.debug('sourceIsLocal = '+sourceIsLocal);

      if(sourceFileElement){

        sourceFilePath=sourceFileElement.filePath;
        sourceFileName=sourceFileElement.fileName;
        sourceIsDir=sourceFileElement.isDir;

        Ispaces.logger.debug('sourceFileName = '+sourceFileName);
        Ispaces.logger.debug('sourceFilePath = '+sourceFilePath);
        Ispaces.logger.debug('sourceIsDir = '+sourceIsDir);

      //}
      //if(!sourceFileElement){
      }else{
        _this.error(Ispaces.getString('Please select a file or folder to copy'));
        return;
      }

      if(targetFileElement){

        targetFilePath=targetFileElement.filePath;
        targetIsDir=targetFileElement.isDir;

        Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
        Ispaces.logger.debug('targetIsDir = '+targetIsDir);

        if(targetIsDir){
          targetFilePathBuilder.appendAll([targetFilePath,FORWARDSLASH,sourceFileName]);
        }else{
          var lastIndexOfForwardSlash=targetFilePath.lastIndexOf(FORWARDSLASH);
          targetFilePathBuilder.appendAll([
            targetFilePath.substring(0,(lastIndexOfForwardSlash+1))  // Get the parent directory name from the fileName
            ,sourceFileName
          ]);
        }

      }else{ // If there is no target folder. Check for a target panel/protocol.

        var targetProtocol=targetPanel.protocol; // check for a panel selected
        Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');

        if(!targetProtocol){
          this.error(Ispaces.getString('Please select a file or folder to copy'));
          return;
        }

        targetFilePathBuilder.appendAll([targetProtocol,':/',sourceFileName]);
      }

    }else{
      _this.error(Ispaces.getString('Please select a file or folder to copy'));
      return;
    }

    var modal=_this.moveModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.moveModal=_this.createMoveModal(true);
      resizableWindow.addModal(modal);
    }

    // Create the new target path...
    targetFilePath=targetFilePathBuilder.asString();  // Override targetFilePath??
    Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
    var protocolAndPath=targetFilePath.split(_this.Constants.COLON);
    var targetProtocol=protocolAndPath[0];
    Ispaces.logger.debug('protocolAndPath = '+protocolAndPath);
    Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
    Ispaces.logger.debug('protocolAndPath[1] = "'+protocolAndPath[1]+'"');

    // References to the source and target panels
    modal.sourcePanel=sourcePanel;
    modal.targetPanel=targetPanel;
    modal.sourceFilePath=sourceFilePath;
    modal.targetFilePath=targetFilePath;

    // Update the dialog.
    modal.divSource.replaceFirst(_this.Create.createTextNode(sourceFileName));
    modal.divTarget.replaceFirst(_this.Create.createTextNode(targetFilePath));
    modal.divTarget.setAttribute('type','file');

    resizableWindow.showModal(modal);

    _this.modal=modal;
  }

  ,createMoveModal:function(){
    Ispaces.logger.debug(this.id+'.createMoveModal()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    //,createDivCell=Create.createDivCell
    //,createDivRow=Create.createDivRow
    //,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n

    ,CLICK=_this.Events.CLICK
    ;

    var modal=this.createModal();

    var txtDiv0=createDiv(createTextNodeI18n("Move")).setClass("txt");
    var txtDiv1=createDiv(createTextNodeI18n("To")).setClass("txt");

    var divSource=createDiv().setClass("from-file");
    var divTarget=createDiv().setClass("to-file");

    modal.divSource=divSource;
    modal.divTarget=divTarget;

    var buttonMove=createDiv(createTextNodeI18n("Move")).setClass("button")
    ,cellMove=Create.createDivCell(buttonMove).setClass("button-cell")
    ,rowButtonMove=Create.createDivRow(cellMove)
    ;

    //buttonMove.addListener(this.Events.CLICK,this.okMove.bind(this,modal));
    buttonMove.addListener(_this.Events.MOUSEDOWN,_this.okMove.bind(_this,modal));

    var divTable=Create.createDivTable(rowButtonMove).setClass("buttons");

    var innerDiv=createDiv([
      txtDiv0
      ,divSource
      ,txtDiv1
      ,divTarget
      ,divTable
    ]).setClass("inner");

    modal.add(innerDiv);

    modal.escapeKey=function(){
      _this.hideModal();
    };

    modal.enterKey=function(e){
      Ispaces.logger.debug(this.id+'.createMoveModal(): modal.enteryKey()');
      _this.okMove();
    };

    return modal;
  }

  ,okMove:function(modal){
    Ispaces.logger.debug(this.id+'.okMove('+modal+')');
    //Ispaces.logger.alert(this.id+'.okMove('+modal+')');

    this.progressCall=new Ispaces.AsyncCall(
      this
      ,"progress"
      ,this.PROGRESS_WAIT  // The progress spinner is delayed for 1 second so that "quick" copys do not get the progress modal.
    );

    var sourcePanel=modal.sourcePanel
    ,targetPanel=modal.targetPanel
    ,sourceFilePath=modal.sourceFilePath
    ,targetFilePath=modal.targetFilePath
    //,sourceListItem=modal.sourceListItem
    //,targetFileElement=modal.targetFileElement
    //,sourceIsLocal=sourcePanel.isLocal
    //,targetIsLocal=targetPanel.isLocal
    ;

    Ispaces.logger.debug('sourcePanel = '+sourcePanel);
    Ispaces.logger.debug('targetPanel = '+targetPanel);
    Ispaces.logger.debug('sourceFilePath = "'+sourceFilePath+'"');
    Ispaces.logger.debug('targetFilePath = "'+targetFilePath+'"');
    //Ispaces.logger.debug('sourceListItem = "'+sourceListItem+'"');
    //if(sourceListItem)Ispaces.logger.debug('sourceListItem.filePath = "'+sourceListItem.filePath+'"');
    //Ispaces.logger.debug('targetFileElement = "'+targetFileElement+'"');
    //if(targetFileElement)Ispaces.logger.debug('targetFileElement.filePath = "'+targetFileElement.filePath+'"');
    //Ispaces.logger.debug('sourceIsLocal = '+sourceIsLocal);
    //Ispaces.logger.debug('targetIsLocal = '+targetIsLocal);

    // For UI development, send back a dummy response.
    //var moveObject={
    //  'f':sourceFilePath
    //  ,'t':targetFilePath
    //  ,sourcePanel:sourcePanel
    //  ,targetPanel:targetPanel
    //};
    //Common.asyncApply(this,"moved",['1',moveObject],3333); // Immitate a medium size file. 3 seconds.
    //Common.asyncApply(this,"moved",['1',moveObject],333);    // Immitate a small "quick" copy file. .3 seconds.
    //return;

    var lastIndexOfFileSeparator=sourceFilePath.lastIndexOf(this.Constants.FORWARDSLASH);
    var fileName=sourceFilePath.substring(lastIndexOfFileSeparator+1);

    Ispaces.logger.debug('fileName = "'+fileName+'"');

    lastIndexOfFileSeparator=targetFilePath.lastIndexOf(this.Constants.FORWARDSLASH);
    targetFilePath=targetFilePath.substring(0,lastIndexOfFileSeparator+1)+fileName;

    if(sourceIsLocal){ // Moving a local file,
      if(targetIsLocal){ // 1) to a local file.
        Ispaces.logger.debug('sourceIsLocal && targetIsLocal');

        //var moved=Ispaces.Files.renameFile({f:sourceFilePath,t:targetFilePath});
        var moved=Ispaces.Files.renameFile(sourceFilePath,targetFilePath);
        Ispaces.logger.debug('moved = '+moved);

        //this.moved();
        this.moved(

          moved?1:0

          ,{
            'f':sourceFilePath
            ,'t':targetFilePath
            ,sourceListItem:sourceListItem
            ,targetFileElement:targetFileElement
            ,"sourcePanel":sourcePanel
            ,"targetPanel":targetPanel
          }

        );

      }else{         // 2) to a remote file.
        Ispaces.logger.debug('sourceIsLocal && !targetIsLocal');

        /*
        var _size=this.leftRight._size; // Get the size for efficient buffering.
        Ispaces.logger.debug(this.id+'.okMove(): size');

        //new Ispaces.Ajax(Ispaces.contextUrl+'/upload',function(r){Ispaces.logger.alert(r)}).upload({f:sourceFilePath,t:targetFilePath}); // Where we have multiple files being copied the sourceFilePath object can be an array for file URLs.
        var copied=phoneCommander.upload({f:sourceFilePath,t:targetFilePath,s:_size});
        Ispaces.logger.debug(this.id+'.okMove(): copied = '+copied);
        var o={
          'f':sourceFilePath
          ,'t':targetFilePath
        };
        this.copied(copied,o);
        */


      }

    }else{ // Moving a remote file,
      if(targetIsLocal){ // 1) to a local file. Downloading.
        Ispaces.logger.debug('!sourceIsLocal && targetIsLocal');

        /*
        var _size=this.leftRight._size; // Get the size for efficient buffering.
        Ispaces.logger.debug(this.id+'.okMove(): _size = '+_size);

        //new Ispaces.Ajax(Ispaces.contextUrl+'/upload',function(r){Ispaces.logger.alert(r)}).upload({f:sourceFilePath,t:targetFilePath}); // Where we have multiple files being copied the sourceFilePath object can be an array for file URLs.
        var copied=phoneCommander.download({f:sourceFilePath,t:targetFilePath,s:_size});
        Ispaces.logger.debug(this.id+'.okMove(): copied = '+copied);
        var o={
          'f':sourceFilePath
          ,'t':targetFilePath
        };
        this.copied(copied,o);
        */

        var downloaded=Ispaces.Files.download({f:sourceFilePath,t:targetFilePath});
        Ispaces.logger.debug('downloaded = '+downloaded);

        //this.copied(
        this.moved(
          downloaded?1:0
          ,{
            'f':sourceFilePath
            ,'t':targetFilePath
            ,sourcePanel:sourcePanel
            ,targetPanel:targetPanel
            //,sourceListItem:sourceListItem
            ,targetFileElement:targetFileElement
          }
        );

      }else{          // 2) to a remote file - rename operation.
        Ispaces.logger.debug('!sourceIsLocal && !targetIsLocal');

        var callback={
          "_this":this
          ,"functionName":"moved"
          ,"args":{
            'f':sourceFilePath
            ,'t':targetFilePath
            ,"sourceListItem":sourceListItem
            ,"targetFileElement":targetFileElement
            ,"sourcePanel":sourcePanel
            ,"targetPanel":targetPanel
          }
        };

        new Ispaces.Ajax(Ispaces.contextUrl+'/move',callback).send({f:sourceFilePath,t:targetFilePath}); // Where we have multiple files being copied the sourceFilePath object can be an array for file URLs.

      }
    }

  }

  /*
  ,moved:function(r,o){
    Ispaces.logger.debug(this.id+'.moved(r:'+r+', o:'+o+')');
    //Ispaces.logger.alert(this.id+'.moved(r:'+r+', o:'+o+')');

    // Cancel the progress.
    if(this.progressCall){
      this.progressCall.cancel();
      this.progressCall=null;
    }

    // If there was a progress spinner, stop it.
    if(this.spinner)this.spinner.stop();

    Ispaces.logger.debug('o.f = "'+o.f+'"');
    Ispaces.logger.debug('o.t = "'+o.t+'"');
    //Ispaces.logger.debug('o.sourcePanel = '+o.sourcePanel);
    //Ispaces.logger.debug('o.targetPanel = '+o.targetPanel);
    //Ispaces.logger.debug('o.sourceListItem = '+o.sourceListItem);
    //Ispaces.logger.debug('o.targetFileElement = '+o.targetFileElement);

    var sourcePanel=o.sourcePanel,targetPanel=o.targetPanel;
    Ispaces.logger.debug('sourcePanel = '+sourcePanel+', targetPanel = '+targetPanel);

    var sourceListItem=o.sourceListItem,targetFileElement=o.targetFileElement;
    Ispaces.logger.debug('sourceListItem = '+sourceListItem+', targetFileElement = '+targetFileElement);

    this.hideModal();

    var dataUrl;
    var sound;

    if(parseInt(r)){

      //Ispaces.logger.debug('o.f="'+o.f+'", o.t="'+o.t+'"');

      //dataUrl=Ispaces.contextUrl+'/view/audio/email.wav';
      //dataUrl=Ispaces.contextUrl+'/view/audio/284138_RopeSwishOrArmSwish01.wav';
      //dataUrl=Ispaces.contextUrl+'/view/audio/copy.wav';
      sound="copy";

      var from=o.f,to=o.t;

      //var panelIndex=o.panelIndex,panelIndexPrev=o.panelIndexPrev;
      //Ispaces.logger.debug('panelIndex = '+panelIndex+', panelIndexPrev = '+panelIndexPrev);
      //var sourcePanel=o.sourcePanel,targetPanel=o.targetPanel;
      //Ispaces.logger.debug('sourcePanel = '+sourcePanel+', targetPanel = '+targetPanel);

      //var fileMap=files.copy(protocol,path);
      //var fileTable=this.createTableFiles(protocol,parentNameAndPath[1],fileMap,this.cellFiles); // Create the new file table.
      //this.cellFiles.replaceFirst(fileTable); // Replace the old file table with the new one.
      //this.mouseDownTableRow(null,fileTable.tbody.firstChild,this.cellFiles); // Simulate the mouse down on the first row, to select it.
      //this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.

      var a=from.split(this.Constants.COLON)
      ,sourceProtocol=a[0]
      ,sourceFilePath=a[1]
      ;
      Ispaces.logger.debug('sourceProtocol = '+sourceProtocol+', sourceFilePath = '+sourceFilePath);

      a=to.split(this.Constants.COLON)
      ,targetProtocol=a[0]
      ,targetFilePath=a[1]
      ;
      Ispaces.logger.debug('targetProtocol = '+targetProtocol+', targetFilePath = '+targetFilePath);

      //var copyFile=Ispaces.Files.get(this.root,sourceFilePath);
      //Ispaces.logger.debug('copyFile = '+copyFile);
      //var protocolAndPath=o.t.split(this.Constants.COLON);
      //var protocol=protocolAndPath[0];
      //var path=protocolAndPath[1];
      //var parentNameAndPath=this.getParentNameAndPath(path);
      //Ispaces.logger.debug('protocol = '+protocol+', path = '+path);

      //var leftRight=this.leftRight==this.left?this.right:this.left;
      //var cellFiles=this.cellFiles==this.leftDivFiles?this.rightDivFiles:this.leftDivFiles;
      ////var filePath=leftRight.filePath;

      //var fileMap=files.create(protocol,path,copyFile);
      //var fileUnorderedList=this.createFileUnorderedList(this.root,parentNameAndPath[1],fileMap,cellFiles); // Create the new file listing.
      //cellFiles.replaceFirst(fileUnorderedList); // Replace the old file listing with the new one.
      //this.mouseDownTableRow(null,fileUnorderedList.firstChild,cellFiles); // Simulate the mouse down on the first row, to select it.
      ////this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.

      Ispaces.spaces.getSpace().desktop.refresh(); // Do we need the refresh the current desktop?
      //this.refreshPanel(panelIndexPrev);
      //if(targetPanel)this.refreshPanel(targetPanel);

      //if(sourceListItem)this.refreshListItem(sourceListItem);
      //if(targetFileElement)this.refreshListItem(targetFileElement);

      //if(targetFileElement){
      //  this.refreshListItem(
      //    targetFileElement
      //    ,targetPanel
      //  );
      //}else{
      //  this.refreshPanel(targetPanel);
      //}
      //if(sourceListItem){
      //  this.refreshListItem(
      //    sourceListItem
      //    ,sourcePanel
      //  );
      //}else{
      //  this.refreshPanel(sourcePanel);
      //}
      this.refreshPanel(targetPanel);
      this.refreshPanel(sourcePanel);

    }else{
      sound="access-denied";
    }

    Ispaces.Sounds.play(sound);
  }
  */

  /*
   * Delete Modal
   */

  ,clickDelete:function(e){
    Ispaces.logger.debug(this.id+'.clickDelete('+e+')');

    Common.killEvent(e); // kill the event, otherwise it closes the modal
    //var _this=this;

    var _this=this
    ,cellPanel=_this.cellPanel
    //,panelListItem
    ,panelFileElement
    ,isLocal
    ;

    if(cellPanel){ // is there a panel selected

      isLocal=cellPanel.isLocal;

      /*
      panelListItem=cellPanel.listItem;
      if(!panelListItem){
        var targetProtocol=cellPanel.protocol; // check for a panel selected
        //Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
        if(!targetProtocol){
          _this.error(Ispaces.getString('Please select a file or folder to delete'));
          return;
        }
      }
      */
      panelFileElement=cellPanel.fileElement;
      if(!panelFileElement){
        var targetProtocol=cellPanel.protocol; // check for a panel selected
        //Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
        if(!targetProtocol){
          _this.error(Ispaces.getString('Please select a file or folder to delete'));
          return;
        }
      }

    }else{
      _this.error(Ispaces.getString('Please select a file or folder to delete'));
      return;
    }

    Ispaces.logger.debug('cellPanel = '+cellPanel);
    Ispaces.logger.debug('isLocal = '+isLocal);
    //Ispaces.logger.debug('panelListItem = '+panelListItem);
    Ispaces.logger.debug('panelFileElement = '+panelFileElement);
    Ispaces.logger.debug('cellPanel.fileElement = '+cellPanel.fileElement);

    var modal=_this.deleteModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.deleteModal=_this.createDeleteModal();
      resizableWindow.addModal(modal);
    }

    /*
    // Set the escape route. Set the escape function for the global escape catcher.
    var _this=this;
    modal.escape=function(){
      Ispaces.global.escapeKeyObject=null;
      Ispaces.global.escapeObject=null;
      resizableWindow.uncover();
      _this.cancel();
    };
    Ispaces.global.escapeKeyObject=modal; // Allow the user to escape out of copy modal.
    Ispaces.global.escapeObject=modal; // Allow the user to escape out of copy modal.
    */

    /*
     * from
     */

    //*

    var fileElement;  // fileElement is polymorphic. It can be HTMLDivElement, HTMLListElement or HTMLTableRowElement.
    if(e){
      Ispaces.logger.debug('e.targetElement = '+e.targetElement);
      //Ispaces.logger.alert('e.targetElement = '+e.targetElement);
      fileElement=e.targetElement;
    }
    if(!fileElement){
      Ispaces.logger.debug('cellPanel = '+cellPanel);
      Ispaces.logger.debug('cellPanel.fileElement = '+cellPanel.fileElement);
      fileElement=cellPanel.fileElement;
    }

    //Ispaces.logger.debug('fileElement = '+fileElement);
    modal.fileElement=fileElement; // Allows the list item to be removed after deletion.

    var filePath=fileElement.filePath;
    var fileName=fileElement.fileName;
    var isDir=fileElement.isDir;
    var isRecycle=filePath.indexOf('/.recycle')!=-1;
    //var extension=Ispaces.Launcher.getExtension(fileName);
    //var char=Ispaces.MimeTypes.getChar(extension);

    Ispaces.logger.debug('filePath = "'+filePath+'"');
    Ispaces.logger.debug('isDir = '+isDir);
    Ispaces.logger.debug('isRecycle = '+isRecycle);
    Ispaces.logger.debug('fileName = "'+fileName+'"');
    //Ispaces.logger.debug('extension = "'+extension+'"');
    //Ispaces.logger.debug('char = "'+char+'"');

    var divSource=modal.divSource;
    divSource.replaceFirst(_this.Create.createTextNode(fileName));
    //divSource.filePath=filePath; // Set the URL as a property of the divSource.
    //divSource.setAttribute('ext',extension);
    //divSource.setAttribute('char',char);
    //divSource.setAttribute('type','file');

    // Set some references on the modal to be picked up after the confirmation.
    modal.filePath=filePath;
    modal.isLocal=isLocal;

    //*/


    /*
    var extension;
    var char;

    if(isDir){

      var message=new Ispaces.StringBuilder([
        //'You are about to permanently delete the folder \''
        Ispaces.getString('You are about to permanently delete the folder \'')
        ,fileName
        //,'\' and all of its contents.'
        ,Ispaces.getString('\' and all of its contents.')
      ]).asString();

      var div=_this.Create.createDiv([
        _this.Create.createTextNode(message)
        ,_this.Create.createElement('br')
        //,_this.Create.createTextNode(Ispaces.getString('Are you sure?'))
        ,_this.Create.createTextNodeI18n("Are you sure?")
      ]);

      div.style['lineHeight']='33px';
      div.alignCenterMiddle();

      //modal.divMessage.replaceFirst(Common.Create.createTextNode(message));
      modal.divMessage.replaceFirst(div);

      extension='folder';
      char='H';
      divSource.setAttribute('type','folder');

    }else{

      var lastIndexOfDot=fileName.lastIndexOf(Constants.Characters.DOT);
      //Ispaces.logger.debug('lastIndexOfDot = '+lastIndexOfDot);
      if(lastIndexOfDot!=-1){
        extension=fileName.substring(lastIndexOfDot+1);
      }else{
        extension='default';
      }
      //Ispaces.logger.debug('extension = "'+extension+'"');

      char=Ispaces.MimeTypes.getChar(extension);
      if(!char)char='a';
      //Ispaces.logger.debug('char = "'+char+'"');

      divSource.setAttribute('type','file');
    }

    divSource.setAttribute('ext',extension);
    divSource.setAttribute('char',char);

    if(isRecycle){
      modal.recycleCell.hide();
    }else{
      modal.recycleCell.show();
    }
    //*/

    /*
     * Show the modal.
     */
    //modal.show();
    //centeringTable.show();
    resizableWindow.showModal(modal);

    //modal.on=true;
    _this.modal=modal;
  }

  ,createDeleteModal:function(){
    Ispaces.logger.debug(this.id+'.createDeleteModal()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    //,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n
    ,CLICK=_this.Events.CLICK
    ,MOUSEDOWN=_this.Events.MOUSEDOWN
    ;

    /*
    var modal=_this.createModal()
    ,divDelete=createDiv(createTextNodeI18n("Delete")).setClass("txt")
    ,divSource=createDiv().setClass("from-file")
    ;

    var divMessage=createDiv().setClass("txt")
    ,cellMessage=createDivCell(divMessage).setClass("txt-cell")
    ,rowMessage=createDivRow(cellMessage)
    ;

    var buttonRecycle=createDiv(createTextNodeI18n("Recycle")).setClass("button")
    ,cellRecycle=createDivCell(buttonRecycle).setClass("button-cell")
    ,rowRecycle=Create.createDivRow(cellRecycle)
    ;

    var buttonDelete=createDiv(createTextNodeI18n("Delete")).setClass("button")
    ,cellDelete=createDivCell(buttonDelete).setClass("button-cell")
    ,rowDelete=createDivRow(cellDelete)
    ;

    var divTable=Create.createDivTable([
      rowRecycle
      ,rowDelete
    ]).setClass("buttons");

    var innerDiv=createDiv([
      divDelete
      ,rowMessage
      ,divSource
      ,divTable
    ]).setClass("inner");

    modal.add(innerDiv);
    */

    var modal=_this.createModal();

    var divDelete=createDiv(createTextNodeI18n("Delete")).setClass("txt")
    ,cellDelete=createDivCell(divDelete).setClass("cell-txt")
    ,rowDelete=createDivRow(cellDelete)
    ;

    var divMessage=createDiv().setClass("txt")
    ,cellMessage=createDivCell(divMessage).setClass("cell-txt")
    ,rowMessage=createDivRow(cellMessage)
    ;

    var divSource=createDiv().setClass("from-file")
    ,cellSource=createDivCell(divSource).setClass("cell-file")
    ,rowSource=createDivRow(cellSource).setClass("row-file")
    ;

    var buttonDelete=createDiv(createTextNodeI18n("Delete")).setClass("button")
    ,cellButtonDelete=createDivCell(buttonDelete).setClass("cell-button")
    ,rowButtonDelete=createDivRow(cellButtonDelete)
    ;

    var buttonRecycle=createDiv(createTextNodeI18n("Recycle")).setClass("button")
    ,cellButtonRecycle=createDivCell(buttonRecycle).setClass("cell-button")
    ,rowButtonRecycle=createDivRow(cellButtonRecycle)
    ;

    var divButtons=Create.createDivTable([
      rowButtonRecycle
      ,rowButtonDelete
    ]).setClass("buttons");

    var rowButtons=createDivRow(divButtons);

    var innerDiv=createDiv([
      rowDelete
      ,rowSource
      ,rowMessage
      //,divButtons
      ,rowButtons
    ]).setClass("inner");

    //innerDiv.toFrontModals();

    modal.add(innerDiv);


    //buttonDelete.addListener(CLICK,_this.okDelete.bind(_this,modal));
    buttonDelete.addListener(MOUSEDOWN,_this.okDelete.bind(_this,modal));

    buttonRecycle.enterKeyFunction=function(e){
      Ispaces.logger.debug('buttonRecycle.enterKeyFunction('+e+')');

      Common.stopEventPropagation(e); // There is an onclick handler in the resizableWindow.centeringTable. Prevent the event from propogating there.

      //_this.recycle();

      new Ispaces.Ajax(

        Ispaces.contextUrl+'/recycle/'+modal.filePath

        ,function(r){
          Ispaces.logger.debug('buttonRecycle.enterKeyFunction('+e+'): callback('+r+')');

          var sound;
          if(parseInt(r)){

            sound="recycle";

            //modal.fileElement.rm(); // remove the list item from the DOM

            var fileElement=modal.fileElement;
            var parentUnorderedList=fileElement.parentNode;
            var parentListItem=fileElement.parentUnorderedList.fileElement;
            Ispaces.logger.debug('fileElement = '+fileElement);
            Ispaces.logger.debug('parentUnorderedList = '+parentUnorderedList);
            Ispaces.logger.debug('parentListItem = '+parentListItem);

            //modal.fileElement.rm(); // remove the list item from the DOM
            //modal.fileElement.rm(); // remove the list item from the DOM
            //modal.fileElement.parentNode.remove(modal.fileElement); // remove the list item from the DOM
            parentUnorderedList.remove(fileElement); // remove the list item from the DOM

            _this.refreshListItem(parentListItem);

          }else{
            sound="access-denied";
          }

          _this.hideModal();

          Ispaces.Sounds.play(sound);
        }

      ).doGet();

    };

    //buttonRecycle.addListener(CLICK,buttonRecycle.enterKeyFunction);
    buttonRecycle.addListener(MOUSEDOWN,buttonRecycle.enterKeyFunction);

    modal.divSource=divSource;
    modal.divMessage=divMessage;
    //modal.recycleCell=cellRecycle;  // Naming change: cellRecycle -> cellButtonRecycle
    modal.recycleCell=cellButtonRecycle;
    //modal.escapeKey=_this.hideModal.bind(_this);    // Temporarily removed.
    //modal.enterKey=buttonRecycle.enterKeyFunction;  // Temporarily removed.

    return modal;
  }

  ,okDelete:function(modal,e){
    Ispaces.logger.debug(this.id+'.okDelete('+modal+', '+e+')');
    //Ispaces.logger.alert(this.id+'.okDelete('+modal+', '+e+')');

    var filePath=modal.filePath;
    //var cellPanel=modal.sourcePanel;
    var isLocal=modal.isLocal;
    var fileElement=modal.fileElement;

    //Ispaces.logger.alert('cellPanel = '+cellPanel);
    Ispaces.logger.debug('filePath = "'+filePath+'"');
    Ispaces.logger.debug('isLocal = '+isLocal);
    Ispaces.logger.debug('fileElement = '+fileElement);

    /*
    var callback={
      "_this":this
      ,"functionName":"deleted"
      ,"args":{
        'filePath':filePath
        //,root:this.tr.root
      }
    };
    new Ispaces.Ajax(Ispaces.contextUrl+'/del/'+filePath,callback).doGet();
    */

    if(isLocal){ // deleting a local file

      var deleted=Ispaces.Files.deleteFile(filePath);
      //Ispaces.logger.debug('deleted = '+deleted);

      this.deleted(

        deleted?1:0

        ,{
          fileElement:fileElement
        }

      );

    }else{ // deleting a remote file

      /*
      new Ispaces.Ajax(

        new Ispaces.StringBuilder([
          Ispaces.contextUrl
          ,'/del/'
          ,filePath
        ]).asString()

        //,this.deleted.bind(this)
        ,this.deleted.bind(
          this
          ,{
            fileElement:fileElement
          }
        )

      ).doGet();
      */
      new Ispaces.Ajax(

        Ispaces.contextUrl+'/del/'+filePath

        ,{
          "_this":this
          ,"functionName":"deleted"
          ,"args":{
            'filePath':filePath
            ,'fileElement':fileElement
          }
        }

      ).doGet();

    }

    //this.hideModal();
    //this.resizableWindow.hideModal(modal);
  }

  /**
   * r   // the response
   * o  // the object passed through the callback
   */
  ,deleted:function(r,o){
    Ispaces.logger.debug(this.id+'.deleted(r:'+r+', o:'+o+')');
    //Ispaces.logger.alert(this.id+'.deleted(r:'+r+', o:'+o+')');

    var filePath=o.filePath;

    //,fileElement=o.fileElement
    //,fileElement=o.fileElement.parentUnorderedList.fileElement  // TBD - Need to investigate this.

    Ispaces.logger.debug('filePath = '+filePath);
    //Ispaces.logger.debug('fileElement = '+fileElement);

    var dataUrl;
    var sound;

    if(parseInt(r)){

      sound="recycle";
      //this.refreshListItem(fileElement);
      //divRefresh.addListener(CLICK,this.refresh.bind(this,cellPanel));
      //this.refresh(this.cellPanel);
      this.refresh();

    }else{
      sound="access-denied";
    }
    //_this.hideModal();

    Ispaces.Sounds.play(sound);
  }


  /*
   * New Folder Modal
   */

  ,newFolder:function(e){
    Ispaces.logger.debug(this.id+'.newFolder('+e+')');

    Common.killEvent(e); // WE have to kill the event, otherwise it closes the modal

    var _this=this
    ,cellPanel=_this.cellPanel
    ;

    /*
    var listItem;
    if(cellPanel){ // is there a cellPanel selected
      listItem=cellPanel.listItem;
      if(!listItem){
        var targetProtocol=cellPanel.protocol; // check for a cellPanel selected
        //Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
        if(!targetProtocol){
          _this.error(Ispaces.getString('Please select a destination'));
          return;
        }
      }
    }else{
      _this.error(Ispaces.getString('Please select a destination'));
      return;
    }
    */
    var fileElement;
    if(cellPanel){ // is there a cellPanel selected
      fileElement=cellPanel.fileElement;
      if(!fileElement){
        var targetProtocol=cellPanel.protocol; // check for a cellPanel selected
        //Ispaces.logger.debug('targetProtocol = "'+targetProtocol+'"');
        if(!targetProtocol){
          _this.error(Ispaces.getString('Please select a destination'));
          return;
        }
      }
    }else{
      _this.error(Ispaces.getString('Please select a destination'));
      return;
    }

    //Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('listItem = '+listItem);
    Ispaces.logger.debug('fileElement = '+fileElement);

    var modal=_this.newFolderModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.newFolderModal=_this.createNewFolderModal();
      resizableWindow.addModal(modal);
    }

    /*
    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      //Common.stopEventPropagation(e);
      Ispaces.global.escapeKeyObject=null;
      Ispaces.global.escapeObject=null;
      return false;
    }; // Set the escape route. Set the escape function for the global escape catcher.
    Ispaces.global.escapeKeyObject=modal; // Allow the user to escape out of copy modal.
    Ispaces.global.escapeObject=modal; // Allow the user to escape out of copy modal.
    */

    /*
     * show the modal
     */
    //modal.show();
    //centeringTable.show();
    resizableWindow.showModal(modal);

    Common.placeCursor(modal.input); // place the cursor in the input box

    //modal.on=true;
    _this.modal=modal;
  }

  ,createNewFolderModal:function(){
    Ispaces.logger.debug(this.id+'.createNewFolderModal()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    //,createDivCell=Create.createDivCell
    //,createDivRow=Create.createDivRow
    //,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n

    ,CLICK=_this.Events.CLICK
    ;

    var modal=_this.createModal()

    ,divNewFolder=createDiv(createTextNodeI18n("New Folder")).setClass("txt")
    ,divCreate=createDiv(createTextNodeI18n("Create")).setClass("button")

    //,divSource=Create.createDiv().setClass('from-file')
    ;

    //modal.divSource=divSource;

    /*
     * The input element.
     */
    var input=Common.Create.createInput(
      Constants.Properties.TEXT
      ,Constants.Attributes.NAME
      ,_this.Constants.EMPTY
    )

    //,inputDiv=createDiv(input).setClass("input")
    ,inputDiv=createDiv(input).setClass("textbox")

    ,cellCreate=Create.createDivCell(divCreate).setClass("button-cell")
    ,rowCreate=Create.createDivRow(cellCreate)
    ,divTable=Create.createDivTable(rowCreate).setClass("buttons")

    ,innerDiv=createDiv([
      divNewFolder
      ,inputDiv
      ,divTable
    ]).setClass("inner");
    ;

    modal.add(innerDiv);

    modal.createCell=cellCreate;
    modal.input=input;

    input.setClass("input");
    input.setMinWidth(150);
    input.setWidthPercent(100);
    input.addListener(
      _this.Events.MOUSEDOWN
      ,function(e){Common.stopEventPropagation(e)}
    );
    //input.md(function(e){Common.preventDefaultEvent(e)});
    //input.oc(function(e){Common.preventDefaultEvent(e)});
    input.addListener(
      CLICK
      ,function(e){Common.stopEventPropagation(e)}
    );

    /*
    input.onfocus=function(){_this.setClass(Constants.Strings.ON)};
    input.oc(function(e){
      if(
        !_this.value
        ||
        _this.value&&_this.value=='folder name'
      ){
        _this.value=_this.Constants.EMPTY;
      }
      Common.stopEventPropagation(e)
    });
    //input.setWidthPercent(100);
    input.setFontWeight(Constants.Properties.BOLD);
    */
    //if(_this.centeringTable)_this.centeringTable.input=input;


    var okCreateFolder=_this.okCreateFolder.bind(_this,input);
    divCreate.enterKeyFunction=okCreateFolder;
    divCreate.addListener(CLICK,okCreateFolder);

    modal.escapeKey=_this.hideModal.bind(_this);
    modal.enterKey=okCreateFolder;

    modal.addListener(
      Constants.Events.KEYDOWN
      ,modal.keyEvent=function(e){
        Ispaces.logger.debug('modal.keyEvent('+(e.which||e.keyCode)+')');
        //Ispaces.logger.debug('modal = '+modal);
        var key=e.which||e.keyCode;
        switch(key){
          case 13: // Ispaces.logger.debug('Return/Enter');
            _this.okCreateFolder(input,e);
            Common.killEvent(e); // prevent the event from propogating and dong another okCreateFolder()
        }
      }
    );

    return modal;
  }

  ,okCreateFolder:function(input){
    Ispaces.logger.debug(this.id+'.okCreateFolder(input:'+input+')');

    var name=input.value;
    //Ispaces.logger.debug('name = '+name);

    var cellPanel=this.cellPanel
    ,panelId=cellPanel.id
    ,isLocal=cellPanel.isLocal
    ,filePath=cellPanel.filePath
    //,listItem=cellPanel.listItem
    ,fileElement=cellPanel.fileElement
    ;

    //Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('panelId = '+panelId);
    //Ispaces.logger.debug('isLocal = '+isLocal);
    //Ispaces.logger.debug('filePath = '+filePath);
    //Ispaces.logger.debug('listItem = '+listItem);
    Ispaces.logger.debug('fileElement = '+fileElement);

    var sb=new Ispaces.StringBuilder();

    //if(!listItem){ // if there is no file/folder selected
    if(!fileElement){ // if there is no file/folder selected

      var protocol=cellPanel.protocol; // check for a cellPanel selected
      //Ispaces.logger.debug('protocol = "'+protocol+'"');

      if(protocol){

        sb.appendAll([
          protocol
          ,':/'
        ]);

      }

    }else{

      //var filePath=listItem.filePath;
      var filePath=fileElement.filePath;
      //var isDir=listItem.isDir;
      var isDir=fileElement.isDir;
      //Ispaces.logger.debug('filePath = "'+filePath+'"');
      //Ispaces.logger.debug('isDir = '+isDir);

      if(isDir){
        sb.appendAll([
          filePath
          ,this.Constants.FORWARDSLASH
        ]);
      }else{ // Get the parent directory name from the fileName
        var i=filePath.lastIndexOf(this.Constants.FORWARDSLASH);
        sb.append(filePath.substring(0,i+1));
      }

    }

    sb.append(name);
    var folderPath=sb.asString();
    //Ispaces.logger.debug('folderPath = "'+folderPath+'"');

    /*
    var sb=new Ispaces.StringBuilder();
    sb.append(currentUrl);
    if(!currentUrl.endsWithChar(this.Constants.FORWARDSLASH))sb.append(this.FORWARDSLASH);
    sb.append(name);
    var filePath=sb.asString();
    Ispaces.logger.debug('filePath = '+filePath);
    */

    var callbackObject={
      'filePath':folderPath
      //,'listItem':listItem
      ,'fileElement':fileElement
    };

    //if(this.leftRight.isLocal){ // Creating a local folder.
    if(isLocal){ // Creating a local folder.

      var created=Ispaces.Files.newFolder(folderPath);
      //Ispaces.logger.debug('created = '+created);

      //if(created)this.folderCreated();

      this.folderCreated(
        created?1:0
        /*
        ,{
          'filePath':folderPath
          ,'listItem':listItem
        }
        */
        ,callbackObject
      );

    }else{ // Creating a remote folder.

      new Ispaces.Ajax(

        new Ispaces.StringBuilder([
          Ispaces.contextUrl
          ,'/mkdir/'
          ,folderPath
        ]).asString()

        ,{
          "_this":this
          ,"functionName":"folderCreated"
          /*
          ,"args":{
            'filePath':folderPath
            ,'listItem':listItem
          }
          */
          ,"args":callbackObject
        }

      ).doGet();

    }

    this.hideModal();
  }

  ,folderCreated:function(r,o){
    Ispaces.logger.debug(this.id+'.folderCreated(r:'+r+', o:'+o+')');

    var filePath=o.filePath
    //,listItem=o.listItem
    ,fileElement=o.fileElement
    ;

    //Ispaces.logger.debug('filePath = '+filePath);
    //Ispaces.logger.debug('listItem = '+listItem);
    Ispaces.logger.debug('fileElement = '+fileElement);

    var sound;

    if(parseInt(r)){

      sound="email";
      //this.refreshPath(filePath);
      //this.refreshListItem(listItem);
      //this.refreshFileElement(fileElement); // @PossibleFuture
      this.refresh();

    }else{
      sound="access-denied";
    }

    //_this.hideModal();
    Ispaces.Sounds.play(sound);

    /*
    var protocolAndPath=o.filePath.split(this.Constants.COLON);
    var protocol=protocolAndPath[0];
    var path=protocolAndPath[1];
    var parentNameAndPath=this.getParentNameAndPath(path);

    if(parseInt(r)){
      var fileMap=Ispaces.Files.create(protocol,path,0);
      var fileUnorderedList=this.createFileUnorderedList(this.root,parentNameAndPath[1],fileMap,this.cellFiles); // Create the new file table.
      this.cellFiles.replaceFirst(fileUnorderedList); // Replace the old file table with the new one.
      this.mouseDownTableRow(null,fileUnorderedList.firstChild,this.cellFiles); // Simulate the mouse down on the first row, to select it.
      //this.pathDiv.input.value=parentNameAndPath[1]; // Update the path input.
    }
    */
  }


  /*
   * Authenticate Modal
   */

  ,authenticate:function(protocol,filePath){
    Ispaces.logger.debug(this.id+'.authenticate(protocol:"'+protocol+'", filePath:"'+filePath+'")');

    var _this=this
    ,modal=_this.authModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.authModal=_this.createAuthModal(filePath);
      resizableWindow.addModal(modal);
    }

    /*
    var message=new Ispaces.StringBuilder([
      'You need to log in to your '
      ,protocol
      ,' account to access your files.'
    ]).asString();
    modal.textDiv.replaceFirst(_this.Create.createTextNode(message));
    */

    modal.protocol=protocol;
    modal.filePath=filePath;

    //modal.show();
    //centeringTable.show();
    resizableWindow.showModal(modal);

    //modal.on=true;
    _this.modal=modal;

    /*
    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      Ispaces.global.escapeKeyObject=null; // Reset the global escape key object to null.
      Ispaces.global.escapeObject=null; // Reset the global escape object to null.
      //Common.stopEventPropagation(e);
      return false;
    }; // Set the escape route. Set the escape function for the global escape catcher.

    Ispaces.global.escapeKeyObject=modal; // Allow the user to escape out of copy modal.
    Ispaces.global.escapeObject=modal; // Allow the user to escape out of copy modal.
    */
    /*
    new Ispaces.AsyncApply(
      this
      ,"setModalEscape"
      ,[
        modal
        ,resizableWindow
      ]
      ,100
    );
    */

  }

  ,createAuthModal:function(filePath){
    Ispaces.logger.debug(this.id+'.createAuthModal(filePath:'+filePath+')');

    /*
     * DOM
     */
    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,createDivCell=Create.createDivCell
    ,createDivRow=Create.createDivRow
    //,createTextNode=Create.createTextNode
    ,createTextNodeI18n=Create.createTextNodeI18n

    ,CLICK=_this.Events.CLICK
    ,MOUSEDOWN=_this.Events.MOUSEDOWN

    ,modal=_this.createModal()

    ,divFirst=createDiv(createTextNodeI18n("First")).setClass("txt")
    ,divAuth=createDiv(createTextNodeI18n("Authenticate")).setClass("button")
    //,divThen=createDiv(createTextNode('...'+Ispaces.getString('then'))).setClass("txt")
    ,divThen=createDiv(createTextNodeI18n("then")).setClass("txt")
    ,divContinue=createDiv(createTextNodeI18n("Continue")).setClass("button")

    ,cellAuth=createDivCell(divAuth).setClass("button-cell")
    ,cellContinue=createDivCell(divContinue).setClass("button-cell")

    ,rowAuth=createDivRow(cellAuth)
    ,rowContinue=createDivRow(cellContinue)

    ,divTable=Create.createDivTable([
      divFirst
      ,rowAuth
      ,divThen
      ,rowContinue
    ]).setClass("inner")

    ;

    modal.add(divTable);

    /*
     * Events
     */
    //divAuth.addListener(CLICK,_this.okAuth.bind(_this,modal));
    divAuth.addListener(MOUSEDOWN,_this.okAuth.bind(_this,modal));
    //divContinue.addListener(CLICK,_this.serviceAuthorized.bind(_this,modal));
    divContinue.addListener(MOUSEDOWN,_this.serviceAuthorized.bind(_this,modal));

    /*
     * Escape and Enter key
     */
    //modal.escapeKey=_this.hideModal.bind(_this);       // Temporarily removed.
    //modal.enterKey=_this.okAuth.bind(_this,filePath);  // Temporarily removed.

    return modal;
  }

  ,serviceAuthorized:function(modal,e){
    Ispaces.logger.debug(this.id+'.serviceAuthorized(modal:"'+modal+'", e:'+e+')');
    //Ispaces.logger.alert(this.id+'.serviceAuthorized(modal:"'+modal+'", e:'+e+')');

    if(e)Common.stopEventPropagation(e);

    var _this=this;
    var protocol=modal.protocol;
    Ispaces.logger.debug('protocol = '+protocol);

    new Ispaces.Ajax(

      Ispaces.contextUrl+'/ServiceAuthorized'

      ,function(r){
        Ispaces.logger.debug('serviceAuthorized(protocol:"'+protocol+'"): callback('+r+')');

        var authorized=eval(Common.parens(r));
        Ispaces.logger.debug('authorized = '+authorized);
        //Ispaces.logger.alert('authorized = '+authorized);

        if(authorized){

          var cellPanel=_this.cellPanel;
          Ispaces.logger.debug('cellPanel = '+cellPanel);

          _this.tree({
            cellPanel:cellPanel
            ,protocol:protocol
            ,cellFiles:cellPanel.cellFiles
            ,isLocal:cellPanel.isLocal
            //,refresh:true
          });
        }

        //_this.hideModal(); // Temporary - hiding the modal before the tree has been received.
        _this.resizableWindow.hideModal(modal); // Temporary - hiding the modal before the tree has been received.
      }

    ).doGet();

    return false;
  }

  /*
   * http://stackoverflow.com/questions/4964130/target-blank-vs-target-new
   * http://www.w3schools.com/jsref/met_win_open.asp
   */
  ,okAuth:function(modal,e){
    Ispaces.logger.debug(this.id+'.okAuth(modal:'+modal+', e:'+e+')');

    if(e)Common.stopEventPropagation(e); // There is an onclick handler in the resizableWindow.centeringTable to close it. Prevent the event from propogating there.

    Ispaces.logger.debug('modal.filePath = '+modal.filePath);

    var newWindow=window.open(
      modal.filePath
      ,'_blank'
    );

    //var newWindow=window.open('http://www.irishdictionary.ie','_blank'); // for development
    newWindow.focus();
  }


  /*
   * Error Modal
   */

  ,error:function(errorText){
    Ispaces.logger.debug(this.id+'.error("'+errorText+'")');

    var _this=this
    ,modal=_this.errorModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.errorModal=_this.createErrorModal();
      resizableWindow.addModal(modal);
    }

    var messageDiv=modal.messageDiv;
    messageDiv.replaceFirst(_this.Create.createTextNode(errorText));
    //messageDiv.replaceFirst(_this.Create.createTextNodeI18n(errorText));

    /*
     * show the modal
     */
    //modal.show();
    //centeringTable.show();
    resizableWindow.showModal(modal);

    /*
     * Set a flag and set the modal as a property of the app.
     */
    //modal.on=true;
    _this.modal=modal;

    /*
     * Set the escape route. Set the escape function for the global escape catcher.
     */
    /*
    var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      _this.cancel();
      Ispaces.global.escapeKeyObject=null;
      Ispaces.global.escapeObject=null;
    };
    Ispaces.global.escapeKeyObject=modal;
    Ispaces.global.escapeObject=modal;
    */
  }

  ,createErrorModal:function(){
    Ispaces.logger.debug(this.id+'.createErrorModal()');

    var _this=this
    ,Create=_this.Create
    ,createDiv=Create.createDiv
    ,createTextNodeI18n=Create.createTextNodeI18n
    ,modal=_this.createModal()
    ;

    var messageDiv=createDiv(createTextNodeI18n("Message")).setClass("message");

    var divOk=createDiv(createTextNodeI18n("OK")).setClass("button")
    ,cellOk=Create.createDivCell(divOk).setClass("button-cell")
    ,rowOk=Create.createDivRow(cellOk)
    ;

    var divTable=Create.createDivTable([
      rowOk
    ]).setClass("buttons");

    var innerDiv=createDiv([
      messageDiv
      ,divTable
    ]).setClass("inner");

    modal.add(innerDiv);
    modal.messageDiv=messageDiv;

    modal.escapeKey=_this.hideModal.bind(_this);
    modal.enterKey=_this.okModal.bind(_this,modal);
    divOk.addListener(_this.Events.CLICK,_this.okModal.bind(_this,modal));

    return modal;
  }

  /*
   * Local Roots Modal
   */

  /* dev
  ,addLocalRoots:function(e){
    //Ispaces.logger.debug(this.id+'.addLocalRoots('+e+')');
    var json="['',{'/':'harddrive'}]"; // Temporary - Mac, Linux, UNIX
    Ispaces.setLocalRoots(json,this.id);
  }
  */

  ,addLocalRoots:function(e){
    Ispaces.logger.debug(this.id+'.addLocalRoots('+e+')');

    //Ispaces.Files.addLocalRoots(this.id);
    //new Ispaces.AsyncApply(
    //*
    Common.asyncApply(
      Ispaces.Files
      ,"addLocalRoots"
      ,[this.id]
      ,1
    );
    //*/

    Common.stopEventPropagation(e);

    var _this=this
    ,modal=_this.appletModal
    ,resizableWindow=_this.resizableWindow
    ;

    if(!modal){ // If the modal has not been created before, create it.
      modal=_this.appletModal=_this.createAppletModal();
      resizableWindow.addModal(modal);
    }

    //modal.textDiv.replaceFirst(_this.Create.createTextNode(Ispaces.getString('Accessing the Local File System. Please wait...')));
    //modal.textDiv.replaceFirst(_this.Create.createTextNode('Accessing the Local File System. Please wait...'));
    modal.textDiv.replaceFirst(_this.Create.createTextNodeI18n("Accessing the Local File System. Please wait..."));

    //modal.show();
    //centeringTable.show();
    resizableWindow.showModal(modal);  // This will take care of showing the greyout layer as well as the modal. More OO approach.

    /*
     * Set the escape route. Set the escape function for the global escape catcher.
     */
    /*
    //var _this=this;
    modal.escape=function(){
      resizableWindow.uncover();
      this.hide();
    //  //_this.cancel();
    //  //Common.stopEventPropagation(e);
    //  //return false;
    };
    Ispaces.global.escapeKeyObject=modal; // escape key
    Ispaces.global.escapeObject=modal; // mouse click
    */

    //modal.on=true;
    _this.modal=modal;

    //Ispaces.Files.addLocalRoots(_this.id);
    //new Ispaces.AsyncApply(Ispaces.Files,"addLocalRoots",null,1);
  }

  ,createAppletModal:function(){
    Ispaces.logger.debug(this.id+'.createAppletModal()');

    var _this=this;

    var modal=this.createModal();

    //var textDiv=this.Create.createDiv().setClass('from-file');
    var textDiv=this.Create.createDiv().setClass("message");

    //textDiv.setPadding('20px');
    textDiv.setColor('#444');
    textDiv.setFontSize('18px');

    modal.textDiv=textDiv;
    modal.add(textDiv);

    return modal;
  }
  /*
   * End of Dialogs & Modals
   */


  /*
   * Utility functions
   */
  ,getParentNameAndPath:function(path){
    Ispaces.logger.debug(this.id+'.getParentNameAndPath("'+path+'")');

    if(path.endsWithChar(this.Constants.FORWARDSLASH))path=path.substr(0,path.length-1);

    var lastIndexOfFileSeparator=path.lastIndexOf(this.Constants.FORWARDSLASH);
    //Ispaces.logger.debug('lastIndexOfFileSeparator = '+lastIndexOfFileSeparator);

    if(lastIndexOfFileSeparator==-1){
      return [this.Constants.EMPTY,this.Constants.EMPTY]; // We are at the root.
    } else if(lastIndexOfFileSeparator==0){
      return [this.Constants.EMPTY,this.Constants.FORWARDSLASH]; // We are at the first level.
    }

    //Ispaces.logger.debug('path.substr(0,lastIndexOfFileSeparator) = '+path.substr(0,lastIndexOfFileSeparator));

    return [path.substr(lastIndexOfFileSeparator+1),path.substr(0,lastIndexOfFileSeparator)];
  }

  ,getFilePath:function(protocol,path,fileName){
    //Ispaces.logger.debug(this.id+'.getFilePath(protocol:"'+protocol+'", path:"'+path+'", fileName:"'+fileName+'")');

    /*
    var sb=new Ispaces.StringBuilder([
      protocol
    //  //,':/'
      ,':'
      ,path
    ]);
    */

    var sb=new Ispaces.StringBuilder();
    if(protocol)sb.appendAll([protocol,':']); // The UNIX root does not haev a protocol "/".
    sb.append(path);

    if(
      path!=this.Constants.EMPTY
      &&!path.endsWithChar(this.Constants.FORWARDSLASH)
    ){
      sb.append(this.Constants.FORWARDSLASH);
    }

    if(fileName)sb.append(fileName);

    //Ispaces.logger.debug('sb.asString() = "'+sb.asString()+'"');
    return sb.asString();
  }
  /*
   * End of utility functions.
   */




  /*
   * Panel moving/reordering.
   * Reordering the panels by dragging them to a new position.
   */
  /*
   * A mousedown event handler in the capturing phase on the cellPanel.
   * This function is used to select a panel.
   * It is intended to be used for the capturing phase of the mousedown event
   * so that the panel can be selected before other mousedown handlers inside
   * the panel are activated.
   */
  ,mouseDownPanelCapturing:function(cellPanel){
    Ispaces.logger.debug(this.id+'.mouseDownPanelCapturing(cellPanel:'+cellPanel+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    if(this.cellPanel!=cellPanel){ // only activate if it is a new selected cellPanel

      /*
       * Unset the "active" className on the currently active panel.
       */
      var cellPanelPrevious=this.cellPanel; // set the previous panel to the current panel. @see copy()
      if(cellPanelPrevious){ // The first time in , there is no previous cellPanel.
        cellPanelPrevious.removeClass("active");
        this.cellPanelPrevious=cellPanelPrevious; // set the previous panel to the current panel. @see copy()
      }

      this.cellPanel=cellPanel;     // set the current panel to the mousedown panel being passed in.
      this.cellFiles=cellPanel.cellFiles; // Set the active cellFiles.

      //this.panelCells.forEach(function(cellPanel){cellPanel.setClass("cell-panel")});

      /*
       * Set the "active" className on the mousedown cellPanel.
       */
      //cellPanel.setClass("cell-panel-active");
      //cellPanel.toggleClass("active");
      cellPanel.addClass("active");

      //cellPanel.millis=Common.getMilliseconds(); // Set a timestamp on the panel. @see tabKey() Currently not being used.
      //cellPanel.setBorder(Constants.Borders.RED);

      /*
      var cellPanelI
      ,panelCells=this.panelCells
      ,z=panelCells.length
      ,i
      ;

      for(i=0;i<z;i++){
        cellPanelI=panelCells[i];
        if(cellPanel!=cellPanelI)cellPanelI.setClass('cell-panel');
      }
      */
      //this.panelCells.forEach(function(x){
      //  if(cellPanel!=x)x.setClass('cell-panel');
      //});

    }

    // If we are doing a rename and click on the panel, we need to escape the rename.
    //var escapeObject=Ispaces.global.escapeObject;
    var escapeObject=Common.Escapes.escapeObject;
    if(escapeObject){

      escapeObject.escape();

      //Ispaces.global.escapeObject=null;
      //Ispaces.global.escapeKeyObject=null;
      Common.setEscapeObject(null);
      Common.setEscapeKeyObject(null);
    }

  } // mouseDownPanelCapturing()

  /*
   * Handles the mouse down on the panel.
   */
  /*
  ,mouseDownPanel:function(cellPanelMouseDown,e){
    Ispaces.logger.debug(this.id+'.mouseDownPanel(cellPanelMouseDown:'+cellPanelMouseDown+', e:'+e+')');
    //Ispaces.logger.debug('arguments.length = '+arguments.length);
    //for(var i=0;i<arguments.length;i++)Ispaces.logger.debug('arguments['+i+'] = '+arguments[i]);

    var _this=this
    ,MOUSEMOVE=_this.Events.MOUSEMOVE
    ,panelCells=_this.panelCells
    ;

    if(e){ // This function is called at startup without the event object.


      //var button=e.button;
      var button=e['button']; // which button was clicked 0 = left click, 2 = right click
      var which=e['which']; // get which button was clicked. 1 = left click, 3 = right click

      //Ispaces.logger.object(e);
      //Ispaces.logger.debug('button = '+button);
      //Ispaces.logger.debug('which = '+which);
      //Ispaces.logger.debug('e.shiftKey = '+e.shiftKey);
      //Ispaces.logger.debug('e.ctrlKey = '+e.ctrlKey);
      //Ispaces.logger.debug('e.altKey = '+e.altKey);
      //Ispaces.logger.debug('e.button = '+e.button);
      //Ispaces.logger.debug("e['button'] = "+e['button']);

      if(
        (button!=null&&button===0)  // Left click only (Firefox)
        ||(which!=null&&which===1)  // Left click only (Mac, IE)
        ||Constants.isTouchDevice
      ){

        var cellFiles=cellPanelMouseDown.cellFiles;
        //Ispaces.logger.debug('cellFiles = '+cellFiles);

        // This little snippet prevents a panel from being dragged when the scrollbar is being clicked/dragged.
        //Ispaces.logger.debug('cellFiles.scrollTop = '+cellFiles.scrollTop);
        //Ispaces.logger.debug('cellFiles.scrollHeight = '+cellFiles.scrollHeight);
        //var scrollHeight=cellFiles.scrollHeight;
        //if(scrollHeight){
        //  //Ispaces.logger.debug('scrollHeight = '+scrollHeight);
        //
        //  var clientHeight=cellFiles.clientHeight;
        //  var clientWidth=cellFiles.clientWidth;
        //  var scrolledAmount=(scrollHeight-clientHeight);
        //
        //  //Ispaces.logger.debug('clientHeight = '+clientHeight+', clientWidth = '+clientWidth);
        //  //Ispaces.logger.debug('scrolledAmount = '+scrolledAmount);
        //  //Ispaces.logger.debug('cellFiles.scrollTop = '+cellFiles.scrollTop);
        //
        //  //if(scrolledAmount){ // There is a scrollbar.
        //  if(cellFiles.scrollTop){ // There is a scrollbar.
        //    //Ispaces.logger.info('There is a scrollbar.');
        //
        //    var mouseXY=Common.getMouseXY(e)
        //    ,cellPanelXY=Common.getXY(cellPanelMouseDown)
        //    ,mouseOffset=mouseXY[0]-cellPanelXY[0]
        //    ;
        //
        //    //Ispaces.logger.debug('mouseXY = '+mouseXY);
        //    //Ispaces.logger.debug('cellPanelXY = '+cellPanelXY);
        //    //Ispaces.logger.debug('mouseOffset = '+mouseOffset);
        //    //Ispaces.logger.debug('clientWidth = '+clientWidth);
        //
        //    if(mouseOffset>clientWidth){
        //      //Ispaces.logger.debug('(mouseOffset:'+mouseOffset+' > clientWidth:'+clientWidth+')');
        //      //Ispaces.logger.debug('return true;');
        //      return true;
        //    }
        //  }
        //} // if(scrollHeight) - End of check for scrollbar mousedown.

        //Common.stopEventPropagation(e); // Prevent the drag from doing a selection.
        //Common.killEvent(e); // Prevent the drag from doing a selection.
        e.preventDefault();

        var _this=this
        ,panelDraggable=cellPanelMouseDown.panel
        //,topbarDiv=cellPanelMouseDown.topbarDiv
        ,mouseDownX
        ;

        if(!this.dragPanelFunction){ // Sometimes the dragging gets stuck on. We check for the dragFunction to allow a double click to deactivate the dragging.

          // these both return the same result
          //Ispaces.logger.debug('Common.getMouseX(e) = '+Common.getMouseX(e));
          //Ispaces.logger.debug('e.pageX = '+e.pageX);

          mouseDownX=Common.getMouseX(e);
          //mouseDownX=e.pageX;
          //if(Constants.isTouchDevice){
          //  mouseDownX=e.touches[0].pageX;
          //}else{
          //  mouseDownX=e.pageX;
          //}
          Ispaces.logger.debug('mouseDownX = '+mouseDownX);

          var cellPanelWidthHeight=Common.getWidthHeight(cellPanelMouseDown)
          ,panelDraggableWidthHeight=Common.getWidthHeight(panelDraggable)
          ,cellPanelWidth=cellPanelWidthHeight[0]
          ,panelDraggableWidth=panelDraggableWidthHeight[0]
          ,cellPanelXY=Common.getXY(cellPanelMouseDown)
          //,cellPanelX=cellPanelXY[0]
          ,cellPanelX=Common.getX(cellPanelMouseDown)
          //,panelDraggableXY=Common.getXY(panelDraggable)
          //,panelDraggableX=panelDraggableXY[0]
          ,panelDraggableOffsetLeft=panelDraggable.offsetLeft
          ,panelDraggableOffsetRight=panelDraggableOffsetLeft+panelDraggableWidth
          ;

          //var offsetLeft=panelDraggable.offsetLeft;
          //var offsetLeft=panelDraggable['offsetLeft'];
          //var offsetRight=offsetLeft+panelDraggableWidthHeight[0];

          //Ispaces.logger.debug('cellPanelWidthHeight = '+cellPanelWidthHeight);
          //Ispaces.logger.debug('panelDraggableWidthHeight = '+panelDraggableWidthHeight);
          //Ispaces.logger.debug('panelDraggableWidth = '+panelDraggableWidth);
          //Ispaces.logger.debug('cellPanelXY = '+cellPanelXY);
          //Ispaces.logger.debug('cellPanelX = '+cellPanelX);
          //Ispaces.logger.debug('panelDraggableOffsetLeft = '+panelDraggableOffsetLeft);
          //Ispaces.logger.debug('panelDraggableOffsetRight = '+panelDraggableOffsetRight);

          cellPanelMouseDown.mouseDownX=mouseDownX;

          var cellPanelIndex
          ,panel
          ,panels=[]
          ,panelCellsLength=panelCells.length
          ,i
          ,threshold=5  // the distance in pixel that dragging has to cross before a clone is created and a real drag happens.
          ,_panel=cellPanelMouseDown // set a reference to the event panel
          ;

          var panelOffsetLeft,panelOffsetRight;
          var leftDivCount=0; // Used to get the final resting position of the panel being dragged.
          var panelWidths=[]; // Reset the panelWidths for the next drag/reposition

          // Set the thresholds of each of the other panelCells. For sliding out of position effect.
          // Measure the width of each of other panels and add them to the panelWidths array.
          for(i=0;i<panelCellsLength;i++){
            //panelI=panelCells[p];
            cellPanel=panelCells[i];

            if(cellPanel!=cellPanelMouseDown){ // Do not add the current mousedown panel.

              cellPanel.setOverflow(Constants.Properties.VISIBLE); // Set overflow:visible on the other panelCells so that they remain visible behind the panel being dragged.

              panel=cellPanel.panel;

              var panelWidth=Common.getWidth(panel);
              Ispaces.logger.debug('panelWidth = '+panelWidth);
              panelWidths.push(panelWidth);

              //panel.movingLeft=false; // temporary fix ... movin left or right should only activate once
              //panel.movingRight=false; // temporary fix ... movin left or right should only activate once
              panel.hasMovedLeft=false,panel.hasMovedRight=false; // These properties need to start off false.

              panelOffsetLeft=panel.offsetLeft;
              panelOffsetRight=panelOffsetLeft+panelWidth;
              Ispaces.logger.debug('panelOffsetLeft = '+panelOffsetLeft+', panelOffsetRight = '+panelOffsetRight);
              Ispaces.logger.debug('panelDraggableOffsetLeft = '+panelDraggableOffsetLeft+', panelOffsetLeft = '+panelOffsetLeft+', panelOffsetRight = '+panelOffsetRight);

              panel.leftThreshold=panelOffsetLeft+33;
              panel.rightThreshold=panelOffsetRight-33;
              if(panelDraggableOffsetLeft<panelOffsetLeft){ // Is this panel is to the right of the panel being dragged?
                Ispaces.logger.debug('panel.isRight=true;');
                panel.isRight=true;
              }else{
                Ispaces.logger.debug('panel.isRight=false;');
                panel.isRight=false;
                leftDivCount++;
              }

              panels.push(panel);
            }
          }
          Ispaces.logger.debug('panels.length = '+panels.length);
          Ispaces.logger.debug('leftDivCount = '+leftDivCount);

          this.panelWidths=panelWidths; // Set the panelWidths as a property of the application. @see panel.mouseUp()

          //panelDraggablePositionStart=panelDraggablePositionFinish=leftDivCount;
          //Ispaces.logger.debug('panelDraggablePositionStart = '+panelDraggablePositionStart);
          cellPanelMouseDown.panelDraggablePositionStart=cellPanelMouseDown.panelDraggablePositionFinish=leftDivCount;
          //Ispaces.logger.debug('cellPanelMouseDown.panelDraggablePositionStart = '+cellPanelMouseDown.panelDraggablePositionStart);
          //Ispaces.logger.debug('cellPanelMouseDown.panelDraggablePositionFinish = '+cellPanelMouseDown.panelDraggablePositionFinish);

          Ispaces.global.mouseUpObject=_this;  // Set the global mouseup object.

          // To check the direction of the drag.
          var movingRight=false;
          var prevX=mouseDownX;

          Common.addListener(
            document
            ,MOUSEMOVE
            ,this.dragPanelFunction=function(e0){
              //Ispaces.logger.debug('dragPanelFunction(e0:'+e0+')');

              e0.preventDefault();

              var mouseX=Common.getMouseX(e0);
              //var mouseX;
              //if(Constants.isTouchDevice){
              //  mouseX=e0.touches[0].pageX;
              //  //touchEndX=mouseX;
              //}else{
              //  mouseX=e0.pageX;
              //}
              var movedX=mouseX-mouseDownX;
              //Ispaces.logger.debug('mouseDownX = '+mouseDownX+', mouseX = '+mouseX+', movedX = '+movedX);

              if(
                movedX>=threshold
                ||movedX<=-threshold
              ){

                //Ispaces.logger.debug('cellPanelMouseDown.draggingStarted = '+cellPanelMouseDown.draggingStarted);
                if(!cellPanelMouseDown.draggingStarted){
                  cellPanelMouseDown.draggingStarted=true;

                  _this.cellPanelDragging=cellPanelMouseDown; // @see mouseUp()
                  //_this.cellPanelDragging=panelDraggable; // @see mouseUp()

                  // Set the width/height of the panel so that it remains the same size after the inner panel is removed.
                  // Set the min-width on the panel so it does not automatically change size when the inner panel is removed.
                  // This may not be required when we are doing relative positioning.
                  //cellPanelMouseDown.setWidthHeightPixels(cellPanelWidthHeight[0],cellPanelWidthHeight[1]);
                  //cellPanelMouseDown.setWidthPixels(cellPanelWidth);
                  ////cellPanelMouseDown.setMaxWidth(qcellPanelWidthHeight[0]);
                  //cellPanelMouseDown.setMinWidth(cellPanelWidth);
                  cellPanelMouseDown.fixedWidth(cellPanelWidth);

                  //
                  // IMPORTANT - The enclosing panel needs overflow:visible for the relative positioning to work.
                  //
                  cellPanelMouseDown.setOverflow(Constants.Properties.VISIBLE);

                  //
                  // Set the width/height of the panel being dragged.
                  // This may not be required for relative positioning.
                  //panelDraggable.setWidthHeightPixels(panelWidthHeight[0],panelWidthHeight[1]);

                  //
                  // Bring the panel being dragged to the front.
                  //
                  panelDraggable.toFrontApplications();
                  //panelDraggable.toFrontModals();

                  //
                  // Re-style the panel as it is being dragged.
                  //
                  //Ispaces.ui.shadow0(panelDraggable);
                  //Ispaces.ui.borderRadius(panelDraggable,8);
                  //panelDraggable.setClass('panel-dragged');
                  //cellPanelMouseDown.setClass("cell-panel-dragged");
                  //cellPanelMouseDown.addClass("dragged"); // Add the additional "dragged" class on the celPanel.
                  cellPanelMouseDown.addClass("dragging"); // Add the additional "dragged" class on the celPanel.
                }

                // Now that the threshold has been reached, remove the mousemove listener and replace it with a more efficient handler without any if/else checks/statements.
                Common.removeListener(
                  document
                  ,MOUSEMOVE
                  ,_this.dragPanelFunction
                );

                Common.addListener(
                  document
                  ,MOUSEMOVE
                  ,_this.dragPanelFunction=function(e1){ // this == div
                    //Ispaces.logger.debug('dragPanelFunction(e1:'+e1+')');

                    //var mouseXY=Common.getMouseXY(e1);
                    //movedX=(mouseXY[0]-mouseDownX);
                    //var mouseX;
                    //if(Constants.isTouchDevice){
                    //  mouseX=e1.touches[0].pageX;
                    //  //touchEndX=mouseX;
                    //}else{
                    //  mouseX=e1.pageX;
                    //}
                    var mouseX=Common.getMouseX(e1);

                    //Ispaces.logger.debug('startX = '+startX);
                    //Ispaces.logger.debug('mouseX = '+mouseX);
                    var movedX=mouseX-mouseDownX;
                    //Ispaces.logger.debug('movedX = '+movedX);

                    //Ispaces.logger.debug('mouseDownX = '+mouseDownX+', mouseX = '+mouseX+', movedX = '+movedX+', prevX = '+prevX);

                    //if(mouseX>=prevX){
                    if(mouseX>(prevX+20)){
                      movingRight=true;
                      prevX=mouseX;
                    //}else{
                    }else if(mouseX<(prevX-20)){
                      movingRight=false;
                      prevX=mouseX;
                    }
                    //Ispaces.logger.debug('movingRight = '+movingRight);

                    // The new right/left border X positions.
                    var leftBorder=panelDraggableOffsetLeft+movedX
                    ,rightBorder=panelDraggableOffsetRight+movedX
                    ;

                    //Ispaces.logger.debug('leftBorder = '+leftBorder+', rightBorder = '+rightBorder);

                    var leftThreshold
                    ,rightThreshold
                    ,isRight=false
                    ;

                    //
                    // Check the other panelCells to see if they need sliding out of position.
                    //
                    for(var i=0;i<panels.length;i++){
                      //Ispaces.logger.debug('panels['+i+'] = '+panels[i]);

                      panel=panels[i];
                      isRight=panel.isRight
                      ,leftThreshold=panel.leftThreshold
                      ,rightThreshold=panel.rightThreshold
                      ;

                      //Ispaces.logger.debug(i+' - isRight = '+isRight+', leftThreshold = '+leftThreshold+', rightThreshold = '+rightThreshold);

                      //Ispaces.logger.debug(i+' - movingRight = '+movingRight);
                      //Ispaces.logger.debug(i+' - panel.hasMovedLeft = '+panel.hasMovedLeft);
                      if(movingRight){
                        //Ispaces.logger.debug('movingRight');

                        if(isRight){ // If the panel is to the right, then it can move left.
                          if(!panel.hasMovedLeft){
                            //Ispaces.logger.debug(i+' - !panel.hasMovedLeft');
                            //Ispaces.logger.info(i+' - (rightBorder>leftThreshold) = ('+rightBorder+'>'+leftThreshold+') = '+(rightBorder>leftThreshold));

                            if(rightBorder>leftThreshold){ // The right border crossed the left offset.
                              //Ispaces.logger.info(i+' - The right border crossed the left offset.');
                              //Ispaces.logger.debug(i+' - rightBorder:'+rightBorder+' > leftThreshold:'+leftThreshold);

                              //panel.setLeftPixels(-panelWidthHeight[0]); // Non-animated movement.
                              panel.hasMovedLeft=true;
                              //panelDraggablePositionFinish++;
                              cellPanelMouseDown.panelDraggablePositionFinish++;
                              if(!panel.movingLeft)_this.moveLeft(panel,0,-(panelDraggableWidthHeight[0]+_this.grabberWidth)); // Animated sliding effect.

                            }
                          }
                        }

                        if(panel.hasMovedRight){
                          //Ispaces.logger.debug(i+' - panel.hasMovedRight');

                          if(leftBorder>rightThreshold){ // The left border crossed back over the right offset.
                            //Ispaces.logger.info(i+' - The left border crossed back over the right offset.');
                            //Ispaces.logger.info(i+' - (leftBorder>rightThreshold) = ('+leftBorder+'>'+rightThreshold+') = '+(leftBorder>rightThreshold));
                            //Ispaces.logger.debug(i+' - leftBorder:'+leftBorder+' > rightThreshold:'+rightThreshold);

                            //panel.setLeftPixels(0); // Non-animated movement.

                            panel.hasMovedRight=false;
                            //panelDraggablePositionFinish++;
                            cellPanelMouseDown.panelDraggablePositionFinish++;
                            if(!panel.movingLeft)_this.moveLeft(panel,panelDraggableWidthHeight[0],0); // Animated sliding effect.

                          }
                        }

                      }else{ // i.e. moving left
                      //}if(!movingRight){
                        //Ispaces.logger.debug('!movingRight');

                        if(!isRight){ // If the panel is to the left, then it does not move left.
                          if(!panel.hasMovedRight){
                            //Ispaces.logger.debug(i+' - !panel.hasMovedRight');
                            //Ispaces.logger.debug(i+' - if(leftBorder:'+leftBorder+' < rightThreshold:'+rightThreshold+')');
                            //Ispaces.logger.info(i+' - (leftBorder<rightThreshold) = ('+leftBorder+'<'+rightThreshold+') = '+(leftBorder<rightThreshold));
                            if(leftBorder<rightThreshold){ // The left border crossed the right offset.
                              //Ispaces.logger.info(i+' - The left border crossed the right offset.');
                              //Ispaces.logger.debug('leftBorder:'+leftBorder+' < rightThreshold:'+rightThreshold);

                              //panel.setLeftPixels(panelDraggableWidthHeight[0]); // Non-animated movement.

                              panel.hasMovedRight=true;
                              //panelDraggablePositionFinish--;
                              cellPanelMouseDown.panelDraggablePositionFinish--;
                              if(!panel.movingRight)_this.moveRight(panel,0,(panelDraggableWidthHeight[0]+_this.grabberWidth)); // Animated sliding effect.

                            }
                          }
                        }

                        if(panel.hasMovedLeft){
                          //Ispaces.logger.debug(i+' - panel.hasMovedLeft');
                          //Ispaces.logger.info(i+' - (rightBorder<leftThreshold) = ('+rightBorder+'<'+leftThreshold+') = '+(rightBorder<leftThreshold));
                          if(rightBorder<leftThreshold){ // The right border crossed back over the left offset.
                            //Ispaces.logger.info(i+' - The right border crossed back over the left offset.');
                            //Ispaces.logger.debug('rightBorder:'+rightBorder+' < leftThreshold:'+leftThreshold);

                            //panel.setLeftPixels(0); // Non-animated movement.

                            panel.hasMovedLeft=false;
                            //panelDraggablePositionFinish--;
                            cellPanelMouseDown.panelDraggablePositionFinish--;
                            if(!panel.movingRight)_this.moveRight(panel,(-panelDraggableWidthHeight[0]),0); // Animated sliding effect.

                          }
                        }

                      } // if(movingRight)

                    } // for(var i=0;i<panelOffsets.length;i++)

                    //if(newX>panelMainXY[0]){ // prevent the panel for going past the left side of the app
                    //  panelDraggable.setLeftPixels(newX);
                    //}else{
                    //  panelDraggable.setLeftPixels(panelMainXY[0]);
                    //}
                    panelDraggable.setLeftPixels(movedX);

                  }
                ); // Common.addListener(document, MOUSEMOVE, _this.dragPanelFunction...

              } // if(movedX>=threshold || movedX<=-threshold){

            } // ,this.dragPanelFunction=function(e0) {
          ); // Common.addListener(document,_this.Events.MOUSEMOVE,function,false)

        } // if(!_this.dragPanelFunction)
      } // if(!button===0) // left click only

    } // if(e)
  } // mouseDownPanel()

  ,mouseUpPanel:function(cellPanel,e){
    //Ispaces.logger.debug(this.id+'.mouseUpPanel(cellPanel:'+cellPanel+', e:'+e+')');

    var _this=this;

    var mouseDownX=cellPanel.mouseDownX; // get the original mousedown position from the cellPanel
    //Ispaces.logger.debug('mouseDownX = '+mouseDownX);

    //Ispaces.logger.debug('typeof _this.dragPanelFunction = '+typeof _this.dragPanelFunction);
    if(_this.dragPanelFunction){

      Common.removeListener(
        document
        ,_this.Events.MOUSEMOVE
        ,_this.dragPanelFunction
      );
      _this.dragPanelFunction=null;

      cellPanel.draggingStarted=false; // Reset the draggingStarted flag on the cellPanel. @see mouseDownPanel().

      var panelDraggable=cellPanel.panel;
      var panelDraggablePositionStart=cellPanel.panelDraggablePositionStart;
      var panelDraggablePositionFinish=cellPanel.panelDraggablePositionFinish;

      //Ispaces.logger.debug('panelDraggablePositionStart = '+panelDraggablePositionStart+', panelDraggablePositionFinish = '+panelDraggablePositionFinish);

      if(panelDraggablePositionStart!=panelDraggablePositionFinish){ // The panel was moved to a new position.

        Ispaces.logger.info('The panel was moved to a new position.');

        panelDraggable.newPosition=panelDraggablePositionFinish;

        //var mouseUpX=e.pageX;
        //var mouseUpX;
        //if(Constants.isTouchDevice){
        //  mouseUpX=e.changedTouches[0].pageX;
        //}else{
        //  mouseUpX=e.pageX;
        //}
        var mouseUpX=Common.getMouseX(e);
        Ispaces.logger.debug('mouseUpX = '+mouseUpX);

        var movedX=mouseUpX-mouseDownX;
        Ispaces.logger.debug('movedX = '+movedX);

        var panelWidth=0;
        var endPos=0;

        if(panelDraggablePositionStart<panelDraggablePositionFinish){
          for(var i=panelDraggablePositionStart;i<panelDraggablePositionFinish;i++){
            panelWidth=this.panelWidths[i];
            panelWidth+=this.grabberWidth;
            endPos+=panelWidth;
          }
        }else{
          for(var i=panelDraggablePositionFinish;i<panelDraggablePositionStart;i++){
            panelWidth=this.panelWidths[i];
            panelWidth+=this.grabberWidth;
            endPos-=panelWidth;
          }
        }

        this.moveTo(panelDraggable,endPos,movedX);

      }else{ // The panel was moved but not to a new position. Just restore it.

        Ispaces.logger.info('The panel was moved but not to a new position. Just restore it.');

        //var mouseUpX=e.pageX;;
        //var mouseUpX;
        //if(Constants.isTouchDevice){
        //  mouseUpX=e.changedTouches[0].pageX;
        //}else{
        //  mouseUpX=e.pageX;
        //}
        var mouseUpX=Common.getMouseX(e);
        //Ispaces.logger.debug('mouseUpX = '+mouseUpX);

        var movedX=mouseUpX-mouseDownX;
        //Ispaces.logger.debug('mouseDownX = '+mouseDownX+', mouseUpX = '+mouseUpX+', movedX = '+movedX);

        if(movedX<0)movedX=-movedX; // Sometimes the movedX position can be negative number, where we are moving a panel from right to left.

        if(movedX>0){ // Only reset the position if the drag panel actually moved.

          //this.moveTo(panelDraggable,0,movedX);
          this.moveHome(panelDraggable,movedX);
          //panelDraggable.positionRelative(0); // Reset the panel with a relative position.
          //panelDraggable.setWidthHeightPercent(100); // Reset the width/height of the panel.
          //panelDraggable.setClass("panel"); // Reset the className
          cellPanel.removeClass("dragging"); // Remove the additional "dragged" class on the cellPanel from just being dragged.

          //cellPanel.style.minWidth=this.Constants.EMPTY; // Remove the min-width setting on the cellPanel
          cellPanel.style.minWidth=Constants.Characters.EMPTY; // Remove the min-width setting on the cellPanel
        }

      } // if(panelDraggablePositionStart!=panelDraggablePositionFinish)

    } // if(this.dragPanelFunction)

  }
  */

  /*
   * Moving home, after a failed drag & drop reposition.
   */
  /*
  ,moveHome:function(panel,fromX){
    Ispaces.logger.debug(this.id+'.moveHome('+panel+', fromX:'+fromX+')');

    panel.fromX=fromX;

    var movingHome;

    if(fromX>0){
      movingHome=new Ispaces.AsyncApplyer(
        this
        ,this.leftHomeMover
        ,[panel]
        ,5
      );
    }else{
      movingHome=new Ispaces.AsyncApplyer(
        this
        ,this.rightHomeMover
        ,[panel]
        ,5
      );
    }

    panel.movingHome=movingHome; // Set the AsyncApplyer object movingHome as a property of the panel, so it can be stopped when completed.
  }
  */

  /*
  ,leftHomeMover:function(panel){
    //Ispaces.logger.debug(this.id+'.leftHomeMover('+panel+')');

    var x=panel.fromX-=5;
    //Ispaces.logger.debug(this.id+'.leftHomeMover(panel): x = '+x);
    if(x<=0){
      x=0;
      panel.movingHome.stop();
    }
    panel.setLeftPixels(x);
  }

  ,rightHomeMover:function(panel){
    //Ispaces.logger.debug(this.id+'.rightHomeMover('+panel+')');

    var x=panel.fromX+=5;
    //Ispaces.logger.debug(this.id+'.rightHomeMover(panel): x = '+x);
    if(x>=0){
      x=0;
      panel.movingHome.stop();
    }
    panel.setLeftPixels(x);
  }
  //*/

  /*
   * Moving from - to
   */
  /*
  ,moveTo:function(panel,toX,fromX){
    Ispaces.logger.debug(this.id+'.moveTo('+panel+', toX:'+toX+', fromX:'+fromX+')');

    panel.toX=toX;
    panel.fromX=fromX;

    var movingTo;
    if(toX<fromX){
      movingTo=new Ispaces.AsyncApplyer(
        this
        ,this.leftToMover
        ,[panel]
        ,5
      );
    }else{
      movingTo=new Ispaces.AsyncApplyer(
        this
        ,this.rightToMover
        ,[panel]
        ,5
      );
    }
    panel.movingTo=movingTo;
  }

  ,leftToMover:function(panel){
    //Ispaces.logger.debug(this.id+'.leftToMover('+panel+')');

    var x=panel.fromX-=35;
    //Ispaces.logger.debug(this.id+'.leftToMover(panel): x = '+x);

    if(x<=panel.toX){

      x=panel.toX;
      //panel.movingTo.stop();
      panel.setLeftPixels(x);
      this.clearMovingTo(panel);

      return;
    }

    panel.setLeftPixels(x);
  }

  ,rightToMover:function(panel){
    //Ispaces.logger.debug(this.id+'.rightToMover('+panel+')');

    var x=panel.fromX+=35;
    //Ispaces.logger.debug(this.id+'.rightToMover(panel): x = '+x);

    if(x>=panel.toX){

      x=panel.toX;
      //panel.movingTo.stop();
      panel.setLeftPixels(x);
      this.clearMovingTo(panel);

      return;
    }

    panel.setLeftPixels(x);
  }
  //*/

  /*
   * Reset the panels after "moving to" a new position.
   */
  /*
  ,clearMovingToBak:function(panel){
    Ispaces.logger.debug(this.id+'.clearMovingTo('+panel+')');

    panel.movingTo.stop();

    // After the panel has finished dragging, we reset overflow:hidden on the panel.
    var cellPanel=panel.cellPanel;
    //Ispaces.logger.debug('cellPanel = '+cellPanel);

    cellPanel.setOverflow(Constants.Properties.HIDDEN);
    cellPanel.removeClass("dragged"); // Remove the additional "dragged" class on the cellPanel.

    var position=panel.position;
    panel.position=null; // Remove the position for the next drag.

    //Ispaces.logger.debug('position = '+position);
    //Ispaces.logger.debug('this.panelCells.length = '+this.panelCells.length);

    var a=[];

    //panel.setLeftPixels(0);
    //panel.setClass('panel'); // Reset the className
    //panel.style.left=this.Constants.EMPTY;

    //var panelAtPosition=this.panelCells[position];
    //Ispaces.logger.debug('panelAtPosition = '+panelAtPosition);

    //this.panelCells.splice(panel.panel.i,1); // remove the panel being dragged from the panelCells array
    this.panelCells.splice(panel.cellPanel.panelIndex,1); // remove the panel being dragged from the panelCells array
    //this.panelCells.splice(position,0,panel.panel); // add the panel being dragged at the new position
    this.panelCells.splice(position,0,panel.cellPanel); // add the panel being dragged at the new position

    //Ispaces.logger.debug('this.panelCells.length = '+this.panelCells.length);

    for(var i=0;i<this.panelCells.length;i++){
      //Ispaces.logger.debug('this.panelCells['+i+'] = '+this.panelCells[i]);

      cellPanel=this.panelCells[i];
      //Ispaces.logger.debug('cellPanel.panelIndex = '+cellPanel.panelIndex);

      // Reset the cellPanel.
      cellPanel.panelIndex=i;
      //cellPanel.panel.setWidthHeightPercent(100); // Reset the width/height of the panel.
      cellPanel.panel.positionRelative(0);
      cellPanel.panel.setLeftPixels(0);
      cellPanel.panel.setClass("panel"); // Reset the className
      cellPanel.panel.setWidthPixels('');
      cellPanel.setOverflow(Constants.Properties.HIDDEN);
      cellPanel.style.minWidth=this.Constants.EMPTY; // Remove the min-width setting on the cellPanel
      //cellPanel.dragCell.replaceFirst(this.Create.createTextNode(i)); // temporary for development

      if(i>0)a.push(this.createCenterGrabber());

      a.push(cellPanel);
    }

    // Recreate the cellPanel row and replace it.
    var panelRow=this.Create.createDivRow(a);
    this.panelMain.replace(panelRow,this.panelRow);
    this.panelRow=panelRow;

    //this.resetFolderPositions(); // for dnd
    this.resetPositions(); // for dnd
  }
  //*/

  /*
  ,clearMovingTo:function(panel){
    Ispaces.logger.debug(this.id+'.clearMovingTo('+panel+')');

    panel.movingTo.stop();

    var _this=this
    ,cellPanel=panel.cellPanel
    //,panelDraggable=cellPanel.panel
    //,panelDragPositionStart=cellPanel.panelDragPositionStart
    //,panelDragPositionFinish=cellPanel.panelDragPositionFinish
    //,panelPosition=panel.position
    ,panelPosition=cellPanel.position
    ,newPosition=panel.newPosition  // Gets set on mouseup. @see mouseDownPanel
    ,panelCells=_this.panelCells
    ,panelCellsUi=[]  // the array of reordered panels for the UI.. this includes center grabbers
    ;

    //Ispaces.logger.debug('cellPanel = '+cellPanel);
    //Ispaces.logger.debug('cellPanel.position = '+cellPanel.position);
    //Ispaces.logger.debug('panelCells = '+panelCells);
    //Ispaces.logger.debug('panelCells.length = '+panelCells.length);
    //Ispaces.logger.debug('panelPosition = '+panelPosition);
    //Ispaces.logger.debug('newPosition = '+newPosition);

    //Ispaces.logger.alert(this.id+'.clearMovingTo('+panel+'): panel==panelDraggable = '+(panel==panelDraggable));
    //Ispaces.logger.alert(this.id+'.clearMovingTo('+panel+'): panel===panelDraggable = '+(panel===panelDraggable));

    //var indexOfCellPanel=_this.panelRow.indexOf(cellPanel);
    //Ispaces.logger.debug('indexOfCellPanel = '+indexOfCellPanel);
    //Ispaces.logger.debug('indexOfCellPanel = '+indexOfCellPanel+', panelPosition = '+panelPosition);

    cellPanel.setOverflow(Constants.Properties.HIDDEN); // After the panel has finished dragging, we reset overflow:hidden on the panel.
    //cellPanel.removeClass("dragged"); // Remove the additional "dragged" class on the cellPanel.
    cellPanel.removeClass("dragging"); // Remove the additional "dragged" class on the cellPanel.
    //_panel.position=null; // Remove the position for the next drag.

    //Ispaces.logger.debug('panelDraggable = '+panelDraggable);

    //panelCells.splice(panel.cellPanel.i,1); // remove the panel being dragged from the panelCells array
    //panelCells.splice(position,0,panel.cellPanel); // add the panel being dragged at the new position
    //panelCells.splice(indexOfCellPanel,1); // remove the panel being dragged from the panelCells array
    panelCells.splice(panelPosition,1); // remove the panel being dragged from the panelCells array
    panelCells.splice(newPosition,0,cellPanel); // add the panel being dragged at the new position

    //var i
    //,panelCellsLength=panelCells.length
    ////,cellPanelDivTable=cellPanel.divTable
    //;
    //for(i=0;i<panelCellsLength;i++){
    //  Ispaces.logger.debug('panelCells['+i+'] = '+panelCells[i]);
    //  cellPanel=panelCells[i]   // Re-use the cellPanel from the the div.cellPanel in the arguments.
    var x=0;

    panelCells.forEach(function(cellPanel){

      Ispaces.logger.debug('cellPanel = '+cellPanel);

      panel=cellPanel.panel;    // Re-use the panel from the arguments.

      //cellPanel.divTable.positionRelative(0);
      //cellPanel.divTable.setLeftPixels(0);
      //cellPanel.panel.setClass('table-panel'); // Reset the className
      //cellPanel.setOverflow(Constants.Properties.HIDDEN);
      //cellPanelDivTable.positionRelative(0);
      //cellPanelDivTable.setLeftPixels(0);

      // Remove the min-width setting on the cellPanel.
      //cellPanel.style.minWidth=this.Constants.EMPTY; // Remove the min-width setting on the cellPanel
      //cellPanel.style.minWidth=Constants.Characters.EMPTY; // Remove the min-width setting on the cellPanel
      //cellPanel.style.setMinWidth=Constants.Characters.EMPTY; // Remove the min-width setting on the cellPanel
      //cellPanel.removeStyle('minWidth')=Constants.Characters.EMPTY; // Remove the min-width setting on the cellPanel
      //cellPanel.style['minWidth']=Constants.Characters.EMPTY; // Remove the min-width setting on the cellPanel

      // Remove the CSS width setting on the cellPanel.
      //cellPanel.divTable.setWidthPixels('');
      //cellPanel.style['width']=Constants.Characters.EMPTY; // Remove the min-width setting on the cellPanel
      //cellPanel.divTable.setWidth(Constants.Characters.EMPTY);

      //panel.id=panelId;
      //panel.cellText=cellText; // Set a reference to this text cell so it can be updated easily.
      //panel.cellIcon=cellIcon;
      //panel.cellCloseButton=cellCloseButton; // To allow for hiding the close buttons when resizing the panel.
      //panel.resizable=panelTab; // Set a reference to the panel for resizing.
      //panel.dateUpdated=Common.getMilliseconds(); // Set a timestamp on the panels so it can be sorted by date. @see mouseDownTab() & closeTab() so the the next top-most panel sorted by last accessed date can be selected.
      //_this.panelIdTabMap[panelId]=panel; // Add the panel to the panels map.
      //panel.panel=divTable; // @see mouseDownTab()
      //divTable.cellPanel=panel; // @see mouseDownTab()
      //panelCells.push(panel);

      cellPanel.position=x++;

      if(x>1)panelCellsUi.push(_this.createCenterGrabber());

      //cellPanel.setBorder(Constants.Borders.RED);

      panelCellsUi.push(cellPanel);

      panel.positionRelative(0);  // Restore the panel to zero position.
      panel.setLeftPixels(0);  // Restore the panel to zero position.
      //panel.setClass("panel"); // Reset the className
      //panel.setWidthPixels('');
      //setOverflow(Constants.Properties.HIDDEN);
      //style.minWidth=this.Constants.EMPTY; // Remove the min-width setting on the cellPanel
      //cellPanel.setOverflow(Constants.Properties.HIDDEN);
      //cellPanel.panel.setWidthHeightPercent(100); // Reset the width/height of the panel.
      //dragCell.replaceFirst(this.Create.createTextNode(i)); // temporary for development

    });

    // Replace the panel row in the application.
    var panelRow=_this.Create.createDivRow(panelCellsUi);
    _this.panelTable.replace(panelRow,_this.panelRow);
    _this.panelRow=panelRow;

    _this.resetPositions(); // for dnd

    //var rowTabbedApplication=_this.application.rowTabbed;
    //rowTabbedApplication.parentNode.replace(rowTabbed,rowTabbedApplication);
    //_this.rowTabbed=rowTabbed;
    //_this.application.rowTabbed=rowTabbed;

    _this.adjustTabbedMenu(); // Adjust the panel widths before adding the new panel.
    //_this.resetDimensions();

  }
  //*/

  /*
   * Moving left
   */
  /*
  ,moveLeft:function(panel,toX,fromX){
    //Ispaces.logger.debug(this.id+'.moveLeft('+panel+', toX:'+toX+', fromX:'+fromX+')');

    panel.toX=toX;
    panel.fromX=fromX;
    //panel.movingLeft=true;
    panel.movingLeft=new Ispaces.AsyncApplyer(
      this
      ,this.leftMover
      ,[panel]
      ,5
    );
  }

  ,leftMover:function(panel){
    //Ispaces.logger.debug(this.id+'.leftMover('+panel+')');

    var x=panel.toX-=75;
    //Ispaces.logger.debug(this.id+'.leftMover(panel): x = '+x);
    if(x<=panel.fromX){
      x=panel.fromX;
      this.clearLeftMoving(panel);
    }
    panel.setLeftPixels(x);
  }

  ,clearLeftMoving:function(panel){
    //Ispaces.logger.debug(this.id+'.clearLeftMoving('+panel+')');

    panel.movingLeft.stop();
    //panel.movingLeft=false;
    panel.movingLeft=null;
    //panel.hasMovedLeft=true;
    //panel.hasMovedRight=false;
  }
  */

  /*
   * Moving right
   */
  /*
  ,moveRight:function(panel,toX,fromX){
    //Ispaces.logger.debug(this.id+'.moveRight('+panel+', toX:'+toX+', fromX:'+fromX+')');

    panel.toX=toX;
    panel.fromX=fromX;
    //panel.movingRight=true;
    panel.movingRight=new Ispaces.AsyncApplyer(
      this
      ,this.rightMover
      ,[panel]
      ,5
    );
  }

  ,rightMover:function(panel){
    //Ispaces.logger.debug(this.id+'.rightMover('+panel+')');

    var x=panel.toX+=75;
    //Ispaces.logger.debug(this.id+'.rightMover(): x = '+x);
    if(x>=panel.fromX){
      x=panel.fromX;
      this.clearRightMoving(panel);
    }
    panel.setLeftPixels(x);
  }

  ,clearRightMoving:function(panel){
    //Ispaces.logger.debug(this.id+'.clearRightMoving('+panel+')');

    panel.movingRight.stop();
    //panel.movingRight=false;
    panel.movingRight=null;
    //panel.hasMovedRight=true;
    //panel.hasMovedLeft=false;
  }
  */
  /*
   * End of panel moving functionality.
   */



  /*
  ,resetPanels:function(){
    Ispaces.logger.debug(this.id+'.resetPanels()');

    var widthHeight=Common.getWidthHeight(this.divMain);
    Ispaces.logger.debug('widthHeight = '+widthHeight);

    var h=widthHeight[1]-33;

    //this.adjustFileViewsHeights(h);

    var cellPanel
    ,divFiles
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ,i
    ;

    var totalWidth=0;

    for(i=0;i<z;i++){

      cellPanel=panelCells[i]
      ,divFiles=cellPanel.divFiles
      ;

      divFiles.widthHeight=Common.getWidthHeight(divFiles);
      //Ispaces.logger.debug('divFiles.widthHeight = '+divFiles.widthHeight);

      //var cellPanelWidth=Common.getWidth(cellPanel);
      var cellPanelWidthHeight=cellPanel.widthHeight=Common.getWidthHeight(cellPanel);
      //Ispaces.logger.debug('cellPanelWidthHeight = '+cellPanelWidthHeight);
      var cellPanelWidth=cellPanelWidthHeight[0];
      //Ispaces.logger.debug('cellPanelWidth = '+cellPanelWidth);

      //cellPanel.divFiles.setWidthPixels(cellPanelWidth-8);
      //divFiles.setWidthPixels(cellPanelWidth);
      //divFiles.setHeightPixels(h);
      divFiles.setWidthHeightPixels(cellPanelWidth,h);

      //totalWidth+=cellPanelWidth;

      //divFiles=cellPanel.divFiles;
      //Ispaces.logger.debug('divFiles.setHeightPixels('+h+')');
      //divFiles.setHeightPixels(h);
    }
    //Ispaces.logger.debug(this.id+'.resetPanels(): totalWidth = '+totalWidth);

    //for(i=0;i<z;i++){
    //  cellPanel=panelCells[i];
    //  var cellPanelWidth=Common.getWidth(cellPanel);
    //  Ispaces.logger.debug(this.id+'.resetPanels(): cellPanelWidth = '+cellPanelWidth);
    //  var panelWidth=(cellPanelWidth/totalWidth)*100;
    //  Ispaces.logger.debug(this.id+'.resetPanels(): panelWidth = '+panelWidth);
    //  cellPanel.setBorder('red 1px solid');
    //  cellPanel.panel.setBorder('blue 1px solid');
    //  //cellPanel.setWidthPixels(''),cellPanel.setMaxWidth(''); // maWi() allows the overflow to work.
    //  cellPanel.setWidthPercent(panelWidth);
    //  //cellPanel.style.maxWidth=panelWidth+'%';
    //  //cellPanel.divFiles.setWidthPixels(newWidth);
    //  //cellPanel.divFiles.setWidthPercent(100);
    //  //cellPanel.panel.setWidthPercent(100);
    //  //cellPanel.divFiles.setWidthPercent(100);
    //}

    //this.setWidthPixels(widthHeight[0]);

    //this.resizableWindow.divCenter
    //var widthHeight=Common.getWidthHeight(this.resizableWindow.divCenter);
    //Ispaces.logger.debug(this.id+'.resetPanels(): widthHeight = '+widthHeight);
    //Ispaces.logger.alert(this.id+'.resetPanels(): widthHeight = '+widthHeight);

    ////this.divMain.setHeightPixels(widthHeight[1]);
    //this.resizableWindow.divMain.setHeightPixels(widthHeight[1]);
    ////this.divMain.setMinHeight(widthHeight[1]);

    //this.panelCells[0].setHeightPixels(widthHeight[1]);
  }
  */

  /*
  ,restorePanels:function(){
    Ispaces.logger.debug(this.id+'.restorePanels()');

    var widthHeight=this.divMain.widthHeight;
    //Ispaces.logger.debug('widthHeight = '+widthHeight);
    //var h=widthHeight[1];

    var cellPanel
    ,divFiles
    ,panelCells=this.panelCells
    ,z=panelCells.length
    ,i
    ;

    for(i=0;i<z;i++){

      cellPanel=panelCells[i]
      ,cellPanelWidthHeight=cellPanel.widthHeight
      ,divFiles=cellPanel.divFiles
      ,divFilesWidthHeight=divFiles.widthHeight
      ;

      //Ispaces.logger.debug(this.id+'.restorePanels(): cellPanelWidthHeight = '+cellPanelWidthHeight);
      //Ispaces.logger.debug(this.id+'.restorePanels(): divFilesWidthHeight = '+divFilesWidthHeight);

      //Ispaces.logger.debug('divFiles.setWidthPixels(cellPanelWidthHeight[0]:'+cellPanelWidthHeight[0]+')');
      //divFiles.setWidthPixels(cellPanelWidthHeight[0]);
      //divFiles.setMaxWidth(cellPanelWidthHeight[0]);
      divFiles.setWidthHeightPixels(divFilesWidthHeight[0],divFilesWidthHeight[1]);

      //var divFilesWidthHeight=divFiles.widthHeight;
      //Ispaces.logger.debug('divFilesWidthHeight = '+divFilesWidthHeight);
      //divFiles.setHeightPixels(h);
      //Ispaces.logger.debug('divFiles.setHeightPixels(divFilesWidthHeight[1]:'+divFilesWidthHeight[1]+')');
      //divFiles.setHeightPixels(divFilesWidthHeight[1]);
    }

    //this.setWidthPixels(widthHeight[0]);
  }
  */

});

/*
Ispaces.FileManager.start=function(json){
  //Ispaces.logger.debug('FileManager.start('+json+')');
  var o=eval(json);
  var fileManager=new Ispaces.FileManager(o);
  //Ispaces.spaces.getSpace().addApplication(fileManager,o.alive);
  return fileManager;
};
*/
Ispaces.FileManager.start=function(config){
  Ispaces.logger.debug('FileManager.start('+config+')');

  /*
  var fileManager;
  if(Common.isEmpty(o)){
    fileManager=new Ispaces.FileManager();
  }else{
    fileManager=new Ispaces.FileManager(o);
  }
  */
  return new Ispaces.FileManager(config);
};
