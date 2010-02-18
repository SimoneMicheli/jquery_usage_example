/**
 * @author Simone
 */

 $(document).ready(function(){
 //ajax setup --------------------------------------------------------------
	$.ajaxSetup({
		timeout: 5000,
	});
	
	$(".ajax-loader").ajaxSend(function(){
		$(this).slideDown(300);
	});
	
	$(".ajax-loader").ajaxComplete(function(){
		$(this).slideUp(300);
	});
	
	function ajax_error(msg){
	   	$("#ajax_error p:first").text(msg);
		$("#ajax_error").overlay({api: true,}).load();
	 }
	
	//set default option for overlay
	var overlay=$("#overlay").overlay({
	 	api: true,
		oneInstance: true,
		top: '5%',
		expose: {
			color: '#ddd',
			zIndex: 500,
			},
		effect: 'apple',
	});
 	
//contents loader ----------------------------------------------------------
	function loadContents(){
		$.ajax({
				url: "db_list_movies.php",
				type: "GET",
				dataType: "html",
				data: "favourite="+$(".sidebarActive").attr("title")+"&category="+$("#categories-list option:selected").attr("value"),
				beforeSend: function(){
					$("#contents-body").fadeOut("fast");
				},
				success: function(data){
					$("#contents-body").html(data);
					//bind drag to each new film loaded
					$(".movie_drag").each(function(){
  						$(this).add_drag();
  					});
					$("#contents-body").fadeIn("slow");
				},
			});
	}
	
	function loadCategory(queue){
		$.ajax({
			url: "db_list_category.php",
			dataType: "json",
			success: function(data){
				if (data.status == 'ok') {
					$("#categories-list").html("");
					$("#categories-list").append("<option value='-1'>All</option>");
					$("#categories-list").append("<option disabled='disabled'>-----------------</option>");
					for(i=0;i<data.num;i++){
						$("#categories-list").append("<option value="+data.cat[i].id+">"+data.cat[i].name+"</option>");
					}
					$(queue).dequeue("load");
				}
				else{
					ajax_error(data.code+" : "+data.msg);
				}
			},
			error: function(XHR,Status){
				ajax_error(status+" code: "+XHR.status+" description: "+XML.statusText);
			}
		});
	}
	
	//change category
	$("#categories-list").change(function(){
		loadContents();
	});
	
	
//tab navigation -------------------------------------------------------------------
	var click_handler= function(event){
			event.preventDefault();
			$(this).addClass("sidebarActive");
			$(this).unbind("click");
			$(this).droppable("disable");
			var active=this;
			$(".sidebarButton").each(function(){
				//update data if this is not the clicked element
				if(active!=this)
				{
					$(this).removeClass("sidebarActive");
					$(this).bind("click",click_handler);
					$(this).droppable("enable");
				}
			});
			//destroy drag event on film before load
			$(".movie_drag").each(function(){
  				$(this).draggable("destroy");
  			});
			loadContents();
	}	
	
	//bind the click function to each button
	$(".sidebarButton").bind("click",click_handler);
	
	$("#container").hover(function(){
		$("#sidebarWrap").stop().slideDown(500,"easeInExpo").queue(function(){$(this).css("height","auto").dequeue();});
	},function(){
		$("#sidebarWrap").stop().slideToggle(500,"easeOutBounce");
	});
	
//drag & drop ---------------------------------------------------------------------
	   
	//extend jQuery object to perform live bind with helper
	$.fn.add_drag= function(){
		$(this).draggable({
			revert: 'invalid',
	   		scroll: 'false',
	   	    cursor: 'move',
			cursorAt: { top: -5, left: -5 },
	   		helper: function(event) {
		   		return $('<div class="tooltip">Titolo: '+$('.movie_title',this).html()+'</div>');
	   		}
		});
		return this;
	}
	
	$(".sidebarButton").droppable({
		accept: '.movie_drag',
		activeClass: 'sidebarDrop',
		tolerance: "pointer",
		
		//when element is dropped
		drop: function(event,ui){
			//data to send
			var data="id="+ui.draggable.find(".movie_id").html()+"&favourite="+$(this).attr("title");
			var movieContent= ui.draggable.html();
			
			$.ajax({
				url: "db_move.php",
				type: "GET",
				dataType: "json",
				data: data,
				beforeSend: function(){
					ui.draggable.html("Updating...");
				},
				success: function(data){
					if(data.status=='ok')
					 ui.draggable.slideUp();
					else{
					 ui.draggable.html(movieContent);
					 ajax_error("unable to move");	
					}
				},
				error: function(XHR,Status){
					ui.draggable.html(movieContent);
					ajax_error(status+" code: "+XHR.status+" description: "+XML.statusText);
				}
			});
		}
	});

//add movie----------------------------------------------------------------------
	 //load ajax request 
	 $('#new-movie').click(function(event){
		$.ajax({
			dataType: 'html',
			type: 'GET',
			url: 'add_movie.php',
			success: function(data,status,XHR){
				overlay.getOverlay().find(".contentWrap").html(data);
				overlay.load();
			},
			error: function(XHR,Status){
			  ajax_error(status+" code: "+XHR.status+" description: "+XML.statusText);
			},
		});
	 });
	 
//on load sequence----------------------------------------------------------------
	//extend jQuery object to prepare reload queue
	$.extend({
		reload: function(){
			$(document).queue("load",function(){
				loadCategory(this);
			}).queue("load",function(){
				$(".sidebarActive").click();
			}).dequeue("load");
		},
	});
	
	/*$.fn.reload=function(){
		return this.queue("load",function(){
			loadCategory(this);
		}).queue("load",function(){
			$(".sidebarActive").click();
		}).dequeue("load");
	}*/
	
	//load data on document ready
	$.reload();
 });