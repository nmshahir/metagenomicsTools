
function StaticHolder()
{
	if( !StaticHolder.ranges)
	{
		StaticHolder.ranges ={};
		StaticHolder.ordinalScales={};
		StaticHolder.colorScales = {};
		StaticHolder.labelCheckBoxes=[]; 
		StaticHolder.counter =0;
		StaticHolder.goObjects = {};
		StaticHolder.nodes=null;
		StaticHolder.root=null;
		StaticHolder.highlightedNode=null;
	}
	
	this.getNodes = function()
	{
		return StaticHolder.nodes;
	}
	
	this.getHighlightedNode = function()
	{
		return StaticHolder.highlightedNode;
	}
	
	this.setHighlightedNode = function(aNode)
	{
		StaticHolder.highlightedNode = aNode;
	}
	
	this.getRoot = function()
	{
		return StaticHolder.root;
	}
	
	this.setRoot = function(aRoot)
	{
		StaticHolder.root = aRoot;
	}
	
	
	this.setNodes = function(someNodes)
	{
		StaticHolder.nodes = someNodes;
	}
	
	this.getRanges = function()
	{
		return StaticHolder.ranges;
	}
	
	this.getOrdinalScales = function()
	{
		return StaticHolder.ordinalScales;
	}
	
	this.getColorScales = function()
	{
		return StaticHolder.colorScales;
	}
	
	this.getLabelCheckBoxes= function()
	{
		return StaticHolder.labelCheckBoxes;
	}
	
	this.addGoObject = function(goObject)
	{
		StaticHolder.counter++;
		
		StaticHolder.goObjects[StaticHolder.counter] = goObject;
		
		return StaticHolder.counter;
	}
	
	this.getGoObjects = function()
	{
		return StaticHolder.goObjects;
	}
} 


// modded from http://dotnetprof.blogspot.com/2012/11/get-querystring-values-using-javascript.html
function getQueryStrings(aWindow) 
{
    //Holds key:value pairs
    var queryStringColl = null;
            
    //Get querystring from url
    var requestUrl = aWindow.location.search.toString();

    if (requestUrl != '') 
    {
    	requestUrl = requestUrl.substring(1);

        queryStringColl = {};

        //Get key:value pairs from querystring
        var kvPairs = requestUrl.split('&');

        for (var i = 0; i < kvPairs.length; i++) 
        {
            var kvPair = kvPairs[i].split('=');
            queryStringColl[kvPair[0]] = kvPair[1];
        }
    }
   
    return queryStringColl;
}

function GO(parentWindow,thisWindow,isRunFromTopWindow)
{

var aDocument = parentWindow.document;
var thisDocument = thisWindow.document;
var statics = parentWindow.statics;
var thisID = statics.addGoObject(this);
var graphType = "scatter"
var queryStrings = getQueryStrings(thisWindow)
var maxLevel =-1;
var addNoise= false;
var firstNoise = true;
var dataNames = [];

this.addNoise = function()
{
	addNoise= true;
	this.redrawScreen();
}

this.getThisDocument = function()
{
	return thisDocument;
}

if( queryStrings ) 
{
	var aGraphType = queryStrings["GraphType"];
	if( aGraphType != null) 
		graphType = aGraphType;
}

// unregister any other ForceTrees.
// Only 1 ForceTree graph 
if( graphType == "ForceTree" )
{
	for( prop in statics.getGoObjects())
	{
		if( prop != thisID && statics.getGoObjects()[prop] &&
					  statics.getGoObjects()[prop].graphType == "ForceTree")
		{
			prop.unregister();
		}
	}
}
			

this.resort = function()
{
	var compareChoice =  aDocument.getElementById("sortByWhat").value;
  
  	// quantiative
  	if( statics.getRanges()[compareChoice] != null ) 
  	{
		nodes.sort( function(a,b) {
 					 if (1.0 * a[compareChoice]< 1.0 * b[compareChoice])
     						return -1;
  					if (1.0 * a[compareChoice]> 1.0 * b[compareChoice])
    					return 1;
  					return 0; } );
  	}
  	else
  	{
  			nodes.sort( function(a,b) {
 					 if (a[compareChoice]< b[compareChoice])
     						return -1;
  					if (a[compareChoice]> b[compareChoice])
    					return 1;
  					return 0; } );
  
  	}
  
  	for( var x=0; x < nodes.length; x++) 
		nodes[x].listPosition =x;  		
  	
	this.setInitialPositions();
	this.redrawScreen();
}

// modded from http://mbostock.github.com/d3/talk/20111116/force-collapsible.html
var w,h, 
    links,
    link,
    thisContext = this;
    
  	var firstUpdate = true;
  	var reverse =false;
  	var initHasRun = false;
    
  	topNodes= [];
  
  	var dirty = true;
  	
  	var circleDraws = {};
  
    
var force, drag, vis;


this.reforce = function()
{
	if( force != null ) 
	{
		force.stop();
	}
	
	if( vis != null)
	{
		vis.selectAll("text").remove()
		vis.selectAll("circle.node").remove();
		vis.selectAll("line.link").remove();
		vis.selectAll("line").remove();
		d3.select("body").select("svg").remove();
	}
	
	this.setWidthAndHeight();
	
    force = d3.layout.force()
    .charge(function(d) { return d._children ? -d.numSeqs / 100 : -30; })
    .linkDistance(function(d) { return d.target._children ? 80 * (d.nodeDepth-16)/16 : 30; })
    .size([w, h - 60]).gravity(thisDocument.getElementById("gravitySlider").value/100)
    
    drag = force.drag().on("dragstart", function(d) { 
    						
    						// consume the drag event at the node level
    						// otherwise the whole tree gets dragged
    						if( graphType ==  "ForceTree"  && thisDocument.getElementById("dragNodes").checked )
    						{
    							d3.event.sourceEvent.stopPropagation();
        						d.fixed=true; 
        						thisContext.update();
    						}
    						
    							}
    						);

    vis = d3.select("body").append("svg:svg")
    .attr("width", w)
    .attr("height", h)
  .append("g")
    .call(d3.behavior.zoom().scaleExtent([0.01, 100]).on("zoom", thisContext.zoom))
  .append("g");
	 
}

// from http://blog.luzid.com/2013/extending-the-d3-zoomable-sunburst-with-labels/
this.computeTextRotation = function(d) {
	  var angle = x(d.x + d.dx / 2) - Math.PI / 2;
	  return angle / Math.PI * 180;
	}


this.zoom = function() {
  vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  thisContext.redrawScreen();
}

this.setWidthAndHeight = function()
{
	//if( isRunFromTopWindow ) 
	{
		w =  thisWindow.innerWidth-25,
    	h = thisWindow.innerHeight-25;
	}
	//else
	{	
		//w =  thisWindow.innerWidth-25;
    	//h = thisWindow.innerHeight;
	}
	
}

this.getThisId = function()
{
	return thisID;
}

// to be called on window call
this.unregister = function()
{
	console.log("Got unregister " + thisID );
	statics.getGoObjects()[thisID] = null;
	
	if( force ) 
	{
		force.stop();
	}
	
	if( vis ) 
	{
		vis.selectAll("text").remove()
		vis.selectAll("circle.node").remove();
		vis.selectAll("line.link").remove();
		vis.selectAll("line").remove();
	}
	
	
}

this.reVis = function(revisAll)
{
	if( revisAll )
	{
		registered = statics.getGoObjects();
  		for (id in registered)
		{	
			registered[id].reVisOne();
		}			
	}
	else
	{	
		this.reVisOne();
	}

}

this.reVisOne = function() 
{
	
	this.checkForStop()
	this.setWidthAndHeight();
	this.setInitialPositions();
	vis.remove();
	this.reforce();
	dirty=true;
    this.update();
}
  
  
  this.setQuantitativeDynamicRanges = function()
  {
  		var chosen = aDocument.getElementById("colorByWhat");	
  		
  		var aRange = statics.getRanges()[chosen.value];
  		
  		if( isRunFromTopWindow ) 
  		{
	  		if( aRange == null)
	  		{
	  			aDocument.getElementById("lowQuantRange").value = "categorical";
	  			aDocument.getElementById("highQuantRange").value = "categorical";
	  			aDocument.getElementById("lowQuantRange").enabled = false;
	  			aDocument.getElementById("highQuantRange").enabled = false;
	  		}
	  		else
	  		{
	  			aDocument.getElementById("lowQuantRange").value = aRange[0];
	  			aDocument.getElementById("highQuantRange").value = aRange[1];
	  			
	  		}
  		}
  		if( ! firstUpdate ) 
			this.redrawScreen();  	
  }
  
  this.addIndividualMenuDynamicMenuContent = function()
  {
  		var allNames = [];
  		
  		var scatterX = thisDocument.getElementById("scatterX")
  		var scatterY = thisDocument.getElementById("scatterY")
  		
  		var xString = "<option value=\"circleX\">circleX</option>";
  		var yString = "<option value=\"circleY\">circleY</option>";
  		
  		scatterX.innerHTML += xString;
  		scatterY.innerHTML += yString;
  		scatterX.innerHTML += yString;
  		scatterY.innerHTML += xString;
  		
  		//todo: these will be in a different order than other menus
  		for (prop1 in statics.getRanges())
  			allNames.push(prop1);
  		
  		for (prop2 in statics.getOrdinalScales())	
  			allNames.push(prop2);
  			
  		for( var x=0; x< allNames.length; x++)
  		{
  			var propertyName = allNames[x];
  			
  			var selectHTML = "<option value=\"" + propertyName
  				+ "\">" + propertyName   +"</option>"
  			
  			scatterX.innerHTML += selectHTML;
  			scatterY.innerHTML += selectHTML;
  		}
  
  }

  this.addDynamicMenuContent =function()
  {
  	if( ! isRunFromTopWindow) 
  		return;
  	
  	var mySidebar = aDocument.getElementById("sidebar");
  	
   	mySidebar.innerHTML +=  "<select id=\"sortByWhat\" onChange=myGo.resort()></select>"

   	mySidebar.innerHTML += "<h3> Size: <h3>"
  	var selectHTML =  "<select id=\"sizeByWhat\" onchange=myGo.redrawScreen()>"
	selectHTML +=  "</select>"	
	mySidebar.innerHTML += selectHTML
	mySidebar.innerHTML += "<br>Max size: <input type=\"number\"" + 
			 " id=\"maxSize\" min=\"0\" max=\"100\" value=\"30\" onchange=myGo.redrawScreen()></input>" +
			 "<br>Min size: <input type=\"number\"" + 
			 " id=\"minSize\" min=\"0\" max=\"100\"  value=\"1\" onchange=myGo.redrawScreen()></input>"   + 
	"<br><input type=\"checkbox\"" + 
			"id=\"logSize\" onchange=myGo.redrawScreen()>log</input>"
			+"<input type=\"checkbox\"" + 
			"id=\"invertSize\" onchange=myGo.redrawScreen()>invert</input><br>"
	
	var dataMenuHTML =   "<li id=\"dataMenu\"><a>Data</a><ul>";
	for( var propertyName in nodes[0])
  		if( 	propertyName != "forceTreeNodeID" 
  				&& propertyName != "x" 
  				&& propertyName != "y"
  				&& propertyName != "children" 
  				&& propertyName != "fixed" 
  				)
  		{
  			var isNumeric = true;
  			var selectHTML = "<option value=\"" + propertyName
  				+ "\">" + propertyName   +"</option>"
  				
  				var range=[]
  				range[0] = nodes[0][propertyName];
  				range[1] = nodes[0][propertyName];
  				
  				if( this.isNumber(range[0]) && this.isNumber(range[1]) ) 
  				{
  					range[0] = 1.0 * range[0];
  					range[1] = 1.0 * range[1];
  				}
  				
  				
  				for( var x=0;  isNumeric && x < nodes.length; x++)
  				{
  					var aVal =nodes[x][propertyName]; 
  					
  					if( ! this.isNumber(aVal))
  					{
  						isNumeric = false;
  					}
  					else
  					{	
  						aVal = 1.0 * aVal;
  						if( aVal < range[0]) 
  							range[0] = aVal;
  						
  						if( aVal > range[1]) 
  							range[1] = aVal;
  					}
  				}
  				
  				if( isNumeric) 
  				{
  					statics.getRanges()[propertyName] = range; 
  				}
  				else
  				{
  					statics.getOrdinalScales()[propertyName] = d3.scale.ordinal();
  					statics.getColorScales()[propertyName] = d3.scale.category20b();
  				}
  				
  				aDocument.getElementById("sizeByWhat").innerHTML += selectHTML
  				aDocument.getElementById("sortByWhat").innerHTML += selectHTML
  				
  				if(propertyName != "xMap" 
						&& propertyName != "yMap" 
						&& propertyName != "xMapNoise"
						&& propertyName != "yMapNoise")
					dataMenuHTML+=
						"<li id=\"dataRange" + propertyName + "\"><a>" + propertyName   +" </a></li>"  
						
					dataNames.push( "dataRange" + propertyName );
  		}
	
	dataMenuHTML+= "</ul></li>";
	
	for( var x=0; x < dataNames.push; x++)
	{
		var innerString = "";
		
		for( var y=0; y < 5; y++)
			innerString += "<li>Number " + x + "</li>";
		
		innerString += "";
		aDocument.getElementById(dataNames).innerHTML += innerString;
		
		
	}
	
	aDocument.getElementById("nav").innerHTML+= dataMenuHTML;
		
	mySidebar.innerHTML += "<h3> Color: <h3>";
  	selectHTML =  "<select id=\"colorByWhat\" onchange=myGo.setQuantitativeDynamicRanges()>"
  	
  	selectHTML += "<option value=\"nodeDepth" + "\">" + "node depth"+"</option>"
			
	for( var propertyName in nodes[0])
  		if( propertyName != "forceTreeNodeID" && propertyName != "x" && propertyName != "y"
  				&& propertyName != "children" && propertyName != "fixed" && propertyName != "nodeDepth" )
  		{
  			selectHTML += "<option value=\"" + propertyName
  				+ "\">" + propertyName   +"</option>"
  						
  		}
  	
  	selectHTML += "<option value=\"colorByMarked" 
  				+ "\">" + "marked"+"</option>"
  	
  	selectHTML +=  "</select>"
  	mySidebar.innerHTML += selectHTML
  	mySidebar.innerHTML += "<br><input type=\"checkbox\"" + 
			"id=\"logColor\" onchange=myGo.redrawScreen()>log</input>"
	
  	mySidebar.innerHTML += "<input type=\"checkbox\" id=\"textIsBlack\"" + 
				"onchange=myGo.redrawScreen()>text always black</input>";
  	    
  	var labelHTML = "<li><a>Labels</a><ul>";
  	labelHTML += "<li><input type=\"checkbox\" id=\"cicleLabelScheme\"" + 
			"onchange=myGo.redrawScreen() checked=true>" +
			"Smart circular labels</input><br><input type=\"checkbox\" id=\"labelOnlyTNodes\"" + 
			"onchange=myGo.redrawScreen()> Label only T-Nodes</input></li>"	
				
	for( var propertyName in nodes[0])
  		if( propertyName != "forceTreeNodeID" 
  			&& propertyName != "x" && propertyName != "y")
	  	{
	  		var newHTML = "<li><input type=\"checkbox\" id=\"label" + propertyName + "\"" + 
				"onchange=myGo.redrawScreen()>" + propertyName + "</input></li>";
				
			 labelHTML += newHTML;
			 statics.getLabelCheckBoxes().push("label" + propertyName );
	  	}
	  	
	  	
	labelHTML +="<li>Font Adjust <input type=\"range\" id=\"fontAdjust\""
		 labelHTML += "min=\"5\" max=\"25\" value=\"15\" onchange=myGo.redrawScreen()></input></li>"
			 labelHTML += "</ul></li>"	  	
	  	aDocument.getElementById("nav").innerHTML+= labelHTML;
  	mySidebar.innerHTML += "<h3> Filter: <h3>"
  	
  	mySidebar.innerHTML += "node depth: <input type=\"number\" id=\"depthFilter\" min=\"2\" " + 
  		"max=\" ranges[\"nodeDepth\"] value=2 onchange=myGo.setTopNodes()></input><br>"; 
  		
  	
  	var rangeHTML = "Depth Filter:<input type=\"range\" id=\"depthFilterRange\" min=\"0\" " + 
  	"max=\"" + topNodes.length + "\" value=\"0\" onchange=myGo.showOnlyMarked()><br></input>";
  	
    mySidebar.innerHTML+= rangeHTML;
  	this.setTopNodes();
  	
  	var aTable =""
  	
  	aTable += "<table border=1 id=\"tNodeTable\">"
	aTable +=		"<tr>"
	aTable +=		"<td>Number of Visible Nodes</td>"
	aTable +=			"<td></td>"
	aTable +=		"</tr>"
	aTable +=		"<tr>"
	aTable +=		"<td>Number of TNodes</td>"
	aTable +=		"<td></td>"
	aTable +=		"</tr>"
	aTable +=	"</table>"
  	
  	mySidebar.innerHTML+= aTable;
  
  }
  
  this.setTopNodes = function()
  {
  	topNodes= [];
  
  	for( var x =0; x < nodes.length; x++)
  	{
  		if( nodes[x].nodeDepth == aDocument.getElementById("depthFilter").value) 
  		{	
  			topNodes.push(nodes[x]);
  		}
  	}
  	
  	if( isRunFromTopWindow ) 
  		aDocument.getElementById("depthFilterRange").max = topNodes.length;
  	
  	this.showOnlyMarked();
  }
  
  this.showOnlyMarked = function()
  {
  	var aVal = aDocument.getElementById("depthFilterRange").value;
  	
  	if( aVal==0)
  	{	
  		for( var x=0; x < nodes.length; x++)
  			nodes[x].doNotShow=false;
  	}
  	else
  	{
  		for( var x=0; x < nodes.length; x++)
  			nodes[x].doNotShow=true;
  			
  		aVal = aVal -1;
  		var myNode = topNodes[aVal];
  		
  		function markSelfAndDaughters(aNode)
  		{
  			aNode.doNotShow=false;
  			
  			if( aNode.children != null)
  			{
  				for( var y=0; y < aNode.children.length;y++)
  				{
  					markSelfAndDaughters(aNode.children[y]);
  				}
  			}
  		}
  		
  		markSelfAndDaughters(myNode);
  	}
  	
  	statics.getRoot().doNotShow=false;
  	dirty=true;
  	this.redrawScreen();
  }
  
  // calls redrawAScreen on all registered listeners
  this.redrawScreen= function()
  {
  	registered = statics.getGoObjects();
  	for (id in registered)
	{	
		registered[id].redrawAScreen();
	}
  }
   
  this.redrawAScreen = function()
  {
  	aDocument.getElementById("logSize").enabled=true;
  	aBox = aDocument.getElementById("logColor").enabled=true;
  
  	/* right now these are getting stuck in the off position
  	// can't log an ordinal color scale...
  	if(  statics.getOrdinalScales()[ aDocument.getElementById("sizeByWhat").value] != null )  
  	{
  		aBox = aDocument.getElementById("logSize");
  		aBox.checked=false;
  		aBox.enabled=false;
  	}
  	else
  	{
  		aDocument.getElementById("logSize").enabled=true;
  	}
  	
  	// can't log an ordinal color scale...
  	if(  statics.getOrdinalScales()[ aDocument.getElementById("colorByWhat").value] != null )  
  	{
  		aBox = aDocument.getElementById("logColor");
  		aBox.checked=false;
  		aBox.enabled=false;
  	}
  	else
  	{
  		aBox = aDocument.getElementById("logColor").enabled=true;
  	}
  	*/
  	
  	dirty = true;
  	this.update()
  }

  

this.getLabelText = function(d)
{	
	if( d.marked == false && aDocument.getElementById("labelOnlyTNodes").checked  )
		return "";
	
	var returnString ="";
	
	for( var propertyName in nodes[0])
	{
		var aCheckBox = aDocument.getElementById("label" + propertyName);
		if( aCheckBox != null &&  aCheckBox.checked)
		{
			returnString += d[propertyName] + " ";
		}
	}
	
	if( aDocument.getElementById("cicleLabelScheme").checked  &&
			((thisDocument.getElementById("scatterX").value == "circleX" || 
					thisDocument.getElementById("scatterX").value == "circleY" ) || 
					(thisDocument.getElementById("scatterY").value == "circleX" || thisDocument.getElementById("scatterY").value == "circleY" )))
	{

			if( circleDraws[d.nodeDepth] ==  returnString)	
			{
				return "";	
			}
			
	}
	
	circleDraws[d.nodeDepth] =  "" +  returnString;
	
	
	return returnString;	
}

this.myFilterNodes = function(d)
{
	 if( ! d.doNotShow )
	 	return true;
	 	
	 return false;
}

this.myFilterLinks= function(d)
{
     if( d.source.setVisible  && d.target.setVisible)
      		return true;
      	
      return false;
      		
}

this.gravityAdjust = function()
{
		if  (graphType !=  "ForceTree")		
		{
			myGo.setInitialPositions();
		}	
		
		myGo.redrawScreen();
}

// from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
this.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

this.getAVal = function (chosen, d, xAxis)
		{
		
			if( graphType == "ForceTree" )
			{
					return xAxis? d.x : d.y;	
			}
			
			if( chosen == "circleX" )
				return d.xMap[thisID];
				
			if( chosen == "circleY" ) 
				return d.yMap[thisID];
				
			// quantitative scale 
			if( statics.getRanges()[chosen] != null)
			{	
				var aRange = statics.getRanges()[chosen];
				var aScale = d3.scale.linear().domain(aRange).
					range([0, xAxis ? w : h]).clamp(true);
				return aScale(d[chosen]);
	  		}
	  		else
	  		{
	  			statics.getOrdinalScales()[chosen].
	  				range([0, xAxis ? w : h]); 
  					
				return statics.getOrdinalScales()[chosen](d[chosen]);
	  		}
	  		
	  		alert("Could not find " + chosen);
		}
		
this.addAxis = function(chosen, isXAxis)
{
	if( chosen == "circleX" || chosen == "circleY")
		return;
		
	if( statics.getRanges()[chosen] != null)
	{	
		if( isXAxis)
		{
				var aRange = statics.getRanges()[chosen];
		var aScale = d3.scale.linear().domain(aRange).
					range([0, w]).clamp(true);
		var xAxis = d3.svg.axis()
                  .scale(aScale)
                  .orient( "bottom");
        vis.append("svg:svg").call(xAxis); 
		}
		else
		{
		var aRange = statics.getRanges()[chosen];
		var aScale = d3.scale.linear().domain(aRange).
					range([0, h]).clamp(true);
		var yAxis = d3.svg.axis()
                  .scale(aScale)
                  .orient( "right");
        vis.append("svg:svg").call(yAxis); 
		}
	  }
}

this.getRadiusVal= function(d)
{
	var propToSize = aDocument.getElementById("sizeByWhat").value
	var returnVal = aDocument.getElementById("maxSize").value;
	
	// quantitative values
	if( statics.getRanges()[propToSize] != null)
	{
		if( aDocument.getElementById("logSize").checked) 
		{
			// d3's log scale yields problems with p=0 in range so we 
			// covert everything to log and feed it to the linear scale..
			// as a nice side effect, you don't have to multiply p-values by negative 1
			if( d[propToSize] >0) // a p-value of zero yields a maximum sized radius
			{
				maxScale = Math.log(statics.getRanges()[propToSize][1]) / Math.LN10; 
			
				var aScale= d3.scale.linear().domain([0,maxScale]).range([aDocument.getElementById("minSize").value,
	  					aDocument.getElementById("maxSize").value]).clamp(true);
	  			returnVal = aScale(Math.log(d[propToSize]) / Math.LN10 );
			}
		}
		else
		{
			var aScale= d3.scale.linear().domain(statics.getRanges()[propToSize]).range([aDocument.getElementById("minSize").value,
	  					aDocument.getElementById("maxSize").value]).clamp(true);
	  		returnVal = aScale(d[propToSize]);
		}
		
		
	}
	else //ordinal values 
	{
		statics.getOrdinalScales()[propToSize].range([aDocument.getElementById("minSize").value
  								,aDocument.getElementById("maxSize").value]); 
  					
		returnVal = statics.getOrdinalScales()[propToSize](d[propToSize]);
		
	}
	
	if( aDocument.getElementById("invertSize").checked ) 
	{
		returnVal = aDocument.getElementById("maxSize").value - returnVal;
	}
	
	return returnVal;
	
}
var updateNum=0;

this.toggleVisibilityOfSidebars =function()
{
	var registered = statics.getGoObjects();
  	for (id in registered)
	{
		registered[id].getThisDocument().getElementById("sidebar").style.backgroundColor="#ffffff";
		
		var aDoc =registered[id].getThisDocument(); 
		
		if( aDoc ) 
		{
			if( aDocument.getElementById("showLeftControl").checked )
			{ 
				aDoc.getElementById("sidebar").style.visibility="visible";
			}
			else
			{
				aDoc.getElementById("sidebar").style.visibility="hidden";
			}
		}
		else
		{
			console.log("Could not get doc for " + id);
		}
	}
	
	
	if( aDocument.getElementById("showRightDataPanel").checked ) 
	{
		aDocument.getElementById("rightInfoArea").style.visibility="visible";
		
	}
	else
	{
		aDocument.getElementById("rightInfoArea").style.visibility="hidden";
	}
		
	aDocument.getElementById("rightInfoArea").style.backgroundColor="#ffffff";
		
}

this.update = function() 
{
	if( ! initHasRun )
		return;
 	
	if( dirty ) 
	{
		dirty = false;
		var anyLabels = false;
		
		for( var x=0; x<= maxLevel; x++ )
		{
			circleDraws[x] = "";
		}
		
		
		for( var x=0; ! anyLabels && x < statics.getLabelCheckBoxes().length; x++)
		{
			var aCheckBox = aDocument.getElementById(statics.getLabelCheckBoxes()[x]);
			
			if( aCheckBox != null) 
				anyLabels = aCheckBox.checked
		}
		
		var noiseValue = aDocument.getElementById("noiseSlider").value;
		
		var numMarked =0;
  		var numVisible=0;
	 	for (var i = 0; i < nodes.length; i++)
	 	{
	 		nodes[i].marked= false;
	 		if( ! nodes[i].doNotShow &&  nodes[i].setVisible== true) 
	 		{
	 			nodes[i].marked = true;
		 		numVisible++;
		 		
		 		if( nodes[i].children != null) 
		 		{
		 			for( var j=0; nodes[i].marked && j < nodes[i].children.length; j++ ) 
		 			{
		 				if( ! nodes[i].children[j].doNotShow )
		 				{
		 					nodes[i].marked=false;
		 				}
		 			}
		 		}
		 		
		 		if( nodes[i].marked == true) 
		 			numMarked = numMarked + 1
	 		}
	 		
	 		if( addNoise )
	 		{
	 			if( firstNoise)
	 			{
	 				nodes[i].xMapNoise  = nodes[i].xMap[thisID];
	 				nodes[i].yMapNoise  = nodes[i].yMap[thisID];
	 			}
	 			else
	 			{
	 				nodes[i].xMap[thisID]=nodes[i].xMapNoise ;
	 				nodes[i].yMap[thisID]= nodes[i].yMapNoise;
	 				
	 			}
	 		
	 			var noiseX = 0.1 * nodes[i].xMap[thisID]* Math.random() * (noiseValue/100);
	 			var noiseY = 0.1 * nodes[i].yMap[thisID]* Math.random() * (noiseValue/100);
	 			
	 			if( Math.random() < 0.5) 
	 				noiseX = -noiseX;
	 				
	 			if( Math.random() < 0.5) 
	 				noiseY = -noiseY;
	 				
	 			nodes[i].xMap[thisID] += noiseX;
	 			nodes[i].yMap[thisID] += noiseY;
	 			
	 		}
	 	}
	 	
	 	if( addNoise) 
	 		firstNoise = false;
	 	
	 	for (var i = 0; i < nodes.length; i++)
	 	{
	 		nodes[i].thisNodeColor = this.color(nodes[i]);
	 		nodes[i].thisNodeRadius = this.getRadiusVal(nodes[i]);
	 	}	
		
		vis.selectAll("text").remove()
		vis.selectAll("circle.node").remove();
		vis.selectAll("line.link").remove();
		vis.selectAll("line").remove();
		for( var z=0; z < nodes.length; z++)
			nodes[z].setVisible=false;
		
		var filteredNodes = nodes.filter(this.myFilterNodes);	
		
		for( z=0; z < filteredNodes .length; z++)
			filteredNodes[z].setVisible=true;
		
		if( graphType == "ForceTree") 
		{
			links = d3.layout.tree().links(nodes);
		}
		
  	// Restart the force layout.
 	 
 	 if( graphType == "ForceTree"  ) 
 	 force
      .nodes(nodes)
      
      if( graphType == "ForceTree" 
      			&& ! thisDocument.getElementById("hideLinks").checked )
      force.links(links)
      
      if( graphType == "ForceTree" )
      	force.start().gravity(thisDocument.getElementById("gravitySlider").value/100);
  
		
	  var node = vis.selectAll("circle.node")
	      .data(filteredNodes, function(d) {return d.forceTreeNodeID; } )
	      .style("fill", function(d) { return d.thisNodeColor} )
	      .style("opacity",aDocument.getElementById("opacitySlider").value/100 );
	
	
	  // Enter any new nodes.
	 node.enter().append("svg:circle").on("click", this.myClick)
	      .attr("class", "node")
	      .attr("cx", 
					function (d){return thisContext.getAVal( thisDocument.getElementById("scatterX").value,d,true)}
				)
	      .attr("cy", 
					function (d){return thisContext.getAVal( thisDocument.getElementById("scatterY").value,d,false)}
				)
	      .attr("r", function(d) {  return d.thisNodeRadius})
	      .style("fill", function(d) { return d.thisNodeColor}).
	      style("opacity",aDocument.getElementById("opacitySlider").value/100 ) 
	     .on("mouseenter", this.myMouseEnter)
	      .on("mouseleave", this.myMouseLeave)
	      
	      if( graphType == "ForceTree"  )
	      	node.call(force.drag);
	      
	      function updateNodesLinksText()
	      {
	      
	      	 node.attr("cx", 
					function (d){return thisContext.getAVal( thisDocument.getElementById("scatterX").value,d,true)}
				)
	      	.attr("cy", 
					function (d){return thisContext.getAVal( thisDocument.getElementById("scatterY").value,d,false)}
				)
	    
		  if ( anyLabels )
	      {	
	      	if( graphType == "ForceTree" ) 
	      	{
	      		
	      	text.attr("transform", function(d) { return "translate(" + 
						d.x
							+ "," + d.y+ ")"; });
			
	      	}
	      	else
	      	{
	      		/* radial labels: todo: this should be an option
	      		console.log("set rotate " + Math.PI *
	      				d.listPosition / statics.getNodes().length);
	      		text.attr("transform", function(d) { return "rotate(" + Math.PI *
	      				d.listPosition / statics.getNodes().length
	      					+ ")"});
	      					*/
	      		
	      	text.attr("transform", function(d) { return "translate(" + 
						d.xMap[thisID]
							+ "," + d.yMap[thisID]+ ")"; });
	      	}	      
	      }
			
		if( graphType == "ForceTree"  && ! thisDocument.getElementById("hideLinks").checked )
		{
				link.attr("x1", function(d) { return d.source.x; })
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });
		}
		
		  	thisContext.checkForStop();
	      }
	      
	      if( graphType != "ForceTree"  && ! thisDocument.getElementById("hideLinks").checked
	    		  && ((thisDocument.getElementById("scatterX").value == "circleX" || 
	  					thisDocument.getElementById("scatterX").value == "circleY" ) && 
						(thisDocument.getElementById("scatterY").value == "circleX" 
							|| thisDocument.getElementById("scatterY").value == "circleY" )))
		  {
	    	  	var depth =0;
	    	  
		    	  function addNodeAndChildren(aNode)
		    	  {
		    		  depth++;
		    		  if( !aNode.doNotShow && aNode.children && aNode.children.length > 0 )
		    		  {
		    			  for( var i=0; i < aNode.children.length; i++)
		    			  {
		    				  var childNode = aNode.children[i];
		    				  
		    				  if( ! childNode.doNotShow)
		    				  {
			    				  vis.append("line").attr("x1", aNode.xMap[thisID]).
			    				  					attr("y1", aNode.yMap[thisID]).
			    				  					attr("x2", childNode.xMap[thisID]).
			    				  					attr("y2", childNode.yMap[thisID]).
			    				  					attr("stroke-width", 0.5).
			    				  					attr("stroke", "black");
			    				  
			    				  addNodeAndChildren( childNode );
		    				  }
		    			  }
		    		  }
		    		  depth--;
		    	  }
		    		  
		    		  
		          addNodeAndChildren(statics.getRoot());
		    		  
			}
			
	    thisContext.checkForStop();
		
		force.on("tick", updateNodesLinksText);
		
		force.on("end", updateNodesLinksText);
	    
	      
	      	// Update the links
	      	if( graphType == "ForceTree" && ! thisDocument.getElementById("hideLinks").checked )
  		link = vis.selectAll("line.link")
      .data(links.filter(this.myFilterLinks), function(d) {  return d.target.forceTreeNodeID; }
      		);
	   
	  // Enter any new links.
	  if( graphType == "ForceTree" && ! thisDocument.getElementById("hideLinks").checked )
	  link.enter().insert("svg:line", ".node")
	      .attr("class", "link")
	       
	 	var table = aDocument.getElementById("tNodeTable"); //.rows[0].cells[1].item[0] = "" + numMarked ;
	 	
	 	table.rows[0].cells[1].innerHTML = "" + numVisible;
	 	
	 	var row = table.rows[1];
	 	var cell =row.cells[1];
	 	cell.innerHTML = "" + numMarked;
	

	for( var x=0; x < nodes.length; x++)
	 {	
		nodes[x].nodeLabelText = this.getLabelText(nodes[x]);
	 }


	if ( anyLabels  ) 
	{

    	var text=vis.selectAll("text").data(filteredNodes).enter().append("svg:text")
  				.text( function (d) {  return d.nodeLabelText; })
                 .attr("font-family", "sans-serif")
                 .attr("font-size", aDocument.getElementById("fontAdjust").value + "px")
                 .attr("fill", function(d) {return  thisContext.getTextColor(d) });
         			 
                    if( graphType != "ForceTree")
	                {
	                	 text.attr("x",
	                	 function (d){return thisContext.getAVal( thisDocument.getElementById("scatterX").value,d,true)})
  						.attr("y", 
  						function (d){return thisContext.getAVal( thisDocument.getElementById("scatterY").value,d,false)})
  						
  						/* todo: radial labels should be an option
  						.attr("transform", 
  	         				 	function(d) 
  	         				 	{ 
  									var anAngle = 360.0 *  
       			 					d.listPosition / (Math.PI *statics.getNodes().length);
  									
  									console.log( anAngle);
  									
  	         			 			return "rotate(" + anAngle + "," 
  	         			 					+ thisContext.getAVal( thisDocument.getElementById("scatterX").value,d,true)
  												+ "," + thisContext.getAVal( thisDocument.getElementById("scatterY").value,d,false) + ")"
  	         			         }
  	         		         );
  	         		         */
                    }
                    else
                    {
                    	text.attr("dx", function(d) { return 15; })
                 		.attr("dy", function(d) { return ".35em"; })
                    }
	
	}
  	 	    
  	 	    
 		this.addAxis( 	thisDocument.getElementById("scatterX").value, true);
 		this.addAxis( 	thisDocument.getElementById("scatterY").value, false);
 		

 // cleanup
  if( graphType == "ForceTree" && ! thisDocument.getElementById("hideLinks").checked )
  link.exit().remove();
  
  node.exit().remove();
	}
  	
  	this.checkForStop();
  	// the color choosers don't work unless they are initialized first
  	// hence they are initialized in the "section" and then moved to the appropriate menu
  	// once everything else has settled in...
	if( firstUpdate && isRunFromTopWindow) 
	{
		this.setQuantitativeDynamicRanges();
  		aDocument.getElementById("ColorSubMenu").appendChild(aDocument.getElementById("color1"));
		aDocument.getElementById("color1").style.visibility="visible";
		
		aDocument.getElementById("ColorSubMenu").appendChild(aDocument.getElementById("color2"));
		aDocument.getElementById("color2").style.visibility="visible";
	}	
  	
  	firstUpdate = false;
}

this.checkForStop =function()
{
	
	if ( graphType != "ForceTree" || ! thisDocument.getElementById("animate").checked)
  		force.stop();
	
}

this.getTextColor= function(d)
{
	if(  aDocument.getElementById("textIsBlack").checked ) 
		return "#000000";
		
	var chosen = aDocument.getElementById("colorByWhat").value;
	
	if( statics.getColorScales()[chosen] != null || statics.getRanges()[chosen] != null)
		return this.color(d);
		
}


this.myMouseEnter = function(d)
{
	if (! aDocument.getElementById("mouseOverHighlights").checked)
		return;
	
	if( statics.getHighlightedNode())
	{
		statics.getHighlightedNode().highlight = false;			
	}
		
	statics.setHighlightedNode(d);
	d.highlight = true;
	
	infoPane = aDocument.getElementById("rightInfoArea")
	
	var someHTML = "<table>";
	
	for( prop in d)
	{
		var aVal = "" + d[prop];
		
		//todo: This will truncate long strings..
		someHTML += ( "<tr><td>" +  prop + "</td><td> " + aVal.substring(0,50) + "</td></tr>" )
	}
	
	someHTML += "</table>"
		
	infoPane.innerHTML = someHTML;
	
	dirty = true;
	thisContext.redrawScreen();
}

this.myMouseLeave= function ()
{
	if (! aDocument.getElementById("mouseOverHighlights").checked)
		return;
	
	if( statics.getHighlightedNode())
	{
		statics.getHighlightedNode().highlight = false;			
	}
	
		
	dirty = true;
	thisContext.redrawScreen();
}

this.setInitialPositions = function ()
{
	var root = statics.getRoot();
	
	root.xMap[thisID] =  w / 2.0  + 20;
	root.yMap[thisID] = h /2.0;
	
	var radius = Math.min(w,h)/2;
	
	radius = radius - radius * thisDocument.getElementById("gravitySlider").value/100;
		
	var piTwice= 2* Math.PI ;
	
	for( var x=0; x < nodes.length; x++) 
	{
		var aRad = (parseFloat(nodes[x].nodeDepth)-1)/(maxLevel-1) * radius;
		nodes[x].xMap[thisID]  = root.xMap[thisID]- aRad * Math.cos( piTwice * x/nodes.length) ;
		nodes[x].yMap[thisID]  = aRad * Math.sin( piTwice * x/nodes.length) + root.yMap[thisID];
	}
	
	root.fixed=true;
}


this.initialize = function () {
   
  this.flatten();
  this.addIndividualMenuDynamicMenuContent();
      
  initHasRun = true;
 	dirty = true;
   this.update();
   
   this.toggleVisibilityOfSidebars();
}

this.getQuantiativeColor= function (d)
{
	var chosen = aDocument.getElementById("colorByWhat").value;
	
	var lowColor = "#" + aDocument.getElementById("quantColorLow").value;
	var highColor ="#" + aDocument.getElementById("quantColorHigh").value; 
		
	var aRange = []
	aRange.push(aDocument.getElementById("lowQuantRange").value);
	aRange.push(aDocument.getElementById("highQuantRange").value);
		
	if( lowColor > highColor) 
	{
		var temp = lowColor
		lowColor=  highColor;
		highColor = temp;
	}
		
	if( aDocument.getElementById("logColor").checked) 
	{
		aVal =d[chosen]; 
		maxScale = Math.log(aRange[1]) / Math.LN10; 
		
		if( aVal ==0)
				aVal = maxScale;
		else
			aVal = Math.log(aVal) / Math.LN10; 
			
		var aScale= d3.scale.linear().domain([0,maxScale]).range([lowColor,highColor]).clamp(true);
	  	return aScale(aVal);
	}
	else
	{
		var aScale= d3.scale.linear().domain(aRange).range([lowColor,highColor]).clamp(true);
		return aScale(d[chosen]);	
	}
		
}


this.color= function (d) 
{
	if ( d.highlight == true) 
		return "#fd8d3c"; // orange

	var chosen = aDocument.getElementById("colorByWhat").value;
	
	if( statics.getRanges()[chosen] != null)
		return this.getQuantiativeColor(d);
	
	if( statics.getColorScales()[chosen] != null) 
		return statics.getColorScales()[chosen]( d[chosen] );
		
	if( d._children != null)
		return  "#3182bd";  // bright blue
	
		if(  d.marked )
		return "#000000";  // black
		
		
	return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
		
}

// Toggle children on click.
this.myClick= function (d) {

	var aValue =aDocument.getElementById("clickDoesWhat").value;
	
	if ( aValue == "deletes")
	{
		initHasRun = false;
		d.children=null;
		d._children=null;
		thisContext.initialize();
	}
	if (aValue=="collapses")
	{
		initHasRun = false;
		
		if( d._children == null)
		{
			d._children = d.children;
			d.children =null;
		}
		else
		{
			d.children = d._children 
			d._children = null;
		}
		
		thisContext.initialize();
	}
	else if ( aValue == "hides")
	{
		reverse = ! reverse;
		
		if( reverse == false)
		{
			for( var x =0; x < nodes.length; x++)
				nodes[x].doNotShow=false;
		}
		else
		{
			for( var x =0; x < nodes.length; x++)
				nodes[x].doNotShow=true;
		
			thisContext.highlightAllChildren(d);
			thisContext.highlightAllParents(d);
		}
		
	}
	
	dirty=true;
	thisContext.update();	
}



this.highlightAllChildren = function (d)
{
	if( d== null)
		return;

	if( ! d.children || d.children == null)
		return;	

	d.doNotShow = false;
	for( var x=0; x < d.children.length; x++) 
	{
		this.highlightAllChildren(d.children[x]);
	}
}

this.highlightAllParents = function (d)
{
	if ( d== null)
		return;

	d.doNotShow = false;
	if( ! d.aParentNode ||  d.aParentNode != null)
	{
		thisContext.highlightAllParents(d.aParentNode);
	}
}


// Returns a list of all nodes under the root.
this.flatten= function () 
{
	if( ! isRunFromTopWindow  )
	{
		nodes = statics.getNodes();
		this.setInitialPositions();
  		this.addDynamicMenuContent();
  		return;
	}

  var myNodes = [];
  var level =0.0;
  
  function addNodeAndChildren( aNode) 
	{
		level++;
		maxLevel = Math.max(level,maxLevel);
		if( aNode != null) 
		{
			aNode.nodeDepth = level;
			myNodes.push(aNode);
	
			if( aNode.children != null)
				for( var x=0; x < aNode.children.length; x++)
				{
					addNodeAndChildren(aNode.children[x])
					aNode.children[x].aParentNode = aNode;
				}
					
		}
		level--;
		
			
	}
  
  addNodeAndChildren(statics.getRoot());
  
  for( var i=0; i < myNodes.length; i++)
  {
  	if (!myNodes[i].forceTreeNodeID) myNodes[i].forceTreeNodeID = i+1;
  	
  	myNodes[i].listPosition =i;
  	myNodes[i].xMap = {};
  	myNodes[i].yMap = {};
  	myNodes[i].xMapNoise = {};
  	myNodes[i].yMapNoise = {};
  }
  
  nodes = myNodes;
  statics.setNodes(nodes);
  
  this.setInitialPositions();
  this.addDynamicMenuContent();
  
}

this.reforce();

if( isRunFromTopWindow ) 
{
	aDocument.getElementById("color1").style.visibility="hidden";
	aDocument.getElementById("color2").style.visibility="hidden";
	//todo: nice error message if file can't be found
	d3.json(getQueryStrings(thisWindow)["FileToOpen"], function(json) 
	{
  		statics.setRoot(json);
  		statics.getRoot().fixed = true;
  	thisContext.initialize();  // wait until the data is loaded to initialize
	});
}
else
{
	thisContext.initialize();  // data is already loaded - ok to initialize.
}


}
