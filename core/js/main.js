/**
 * @author Simone
 */
 $(document).ready(function(){
 //ajax setup --------------------------------------------------------------
	$.ajaxSetup({
		timeout: 5000,
		//compatibility with IE
		cache: false,
	});
	
	$(".ajax-loader").ajaxSend(function(){
		$(this).slideDown(300);
	});
	
	$(".ajax-loader").ajaxComplete(function(){
		setTimeout(function(){$(".ajax-loader").slideUp(300);},700);
		
	});
	
	$("#ajax_error").ajaxError(function(e, XHR, settings, exception){
		Ajax_error("Code: "+XHR.status+" Description: "+XML.statusText+"<p>On loading: "+settings.url+"</p>");
	});
	
     Ajax_error=function (msg){
	 	Overlay.close();
	   	$("#ajax_error").find("#error_desc").html(msg);
		$("#ajax_error").overlay({api: true,}).load();
	 };
	
	//set default option for overlay
    Overlay=$("#overlay").overlay({
	 	api: true,
		oneInstance: false,
		top: '8%',
		expose: {
			color: '#ddd',
			zIndex: 500,
			},
		effect: 'apple',
		onClose: function(){
			$.reload();
		},
	});
	 	
//contents loader ----------------------------------------------------------
	function loadContents(){
		$.ajax({
				url: "db_list_movies.php",
				type: "GET",
				dataType: "html",
				data: "favourite="+$(".sidebarActive").attr("ref")+"&category="+$("#categories-list option:selected").attr("value"),
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
					//when data is loaded scrollpage at prevous position
					$("#contents-body").queue(function(){
						$(window).scrollTop(scroll_y);
						$(this).dequeue();
					});
				},
			});
	}
	
	function loadCategory(queue){
		$("#delete-category").hide();
		//save selected element
		if($("#categories-list option:selected").length!=0)
			var selected=$("#categories-list option:selected").attr("value");
		$.ajax({
			url: "db_list_category.php",
			dataType: "json",
			success: function(data){
				if (data.status == 'ok') {
					$("#categories-list").html("");
					$("#categories-list").append("<option value='-1'>All</option>");
					$("#categories-list").append("<option disabled='disabled'>-----------------</option>");
					//build categories selector
					for(i=0;i<data.num;i++){
						$("#categories-list").append("<option value="+data.cat[i].id+">"+data.cat[i].name+"</option>");
					}
					//select old selected element if exist
					$("#categories-list option[value="+selected+"]").attr("selected","selected");
					//continue in queue
					$(queue).dequeue("load");
				}
				else{
					Ajax_error(data.code+" : "+data.msg);
				}
			},
		});
	}
	
//category managment---------------------------------------------------------------
	//change category
	$("#categories-list").change(function(){
		if($("option:selected",this).attr("value")==-1)
			$("#delete-category").hide();
		else
			$("#delete-category").show();
		loadContents();
	});
	
	//delete category
	$("#delete-category").click(function(){
		if(confirm("Do you really want to delete this category and all related movies?")){
			var data=$("#categories-list option:selected").attr("value");
			$.post("db_delete_category.php","id="+data,function(data){
				if(data.status=='ok')
					$.reload();
				else{
					Ajax_error(data.code+" : "+data.msg);
				}
			},"json");
		}
	});
		
//tab navigation -------------------------------------------------------------------
	var click_handler= function(event){
			//event.preventDefault();
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

	//slide fx
	/*
	$("#container").hover(function(){
		$("#sidebarWrap").stop().slideDown(500,"easeInExpo").queue(function(){$(this).css("height","auto").dequeue();});
	},function(){
		$("#sidebarWrap").stop().slideToggle(500,"easeOutBounce");
	});*/
	
	//scroll bar
	var base=$("#sidebarWrap").offset().top;
	$(window).scroll(function(){
	
		var offset=$(window).scrollTop();
		var sp=(offset-base)+60;
		//alert(base+" "+offset+" "+sp);
		if(sp<0)
		  sp=50;
		$("#sidebarWrap").stop().animate({"margin-top": sp,},500);
	});
	
	$().scr
	
//drag & drop ---------------------------------------------------------------------
	   
	//extend jQuery object to perform live bind with helper
	$.fn.add_drag= function(){
		$(this).draggable({
			revert: 'invalid',
	   		scroll: 'false',
	   	    cursor: 'move',
			cursorAt: { top: 4, left: 200 },
	   		helper: function() {
				return $('<div class="tooltip">'+$('.movie_title',this).html()+'</div>');
	   		},
			handle: '.dragger',
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
			var data="id="+ui.draggable.find(".movie_id").html()+"&favourite="+$(this).attr("ref");
			var movieContent= ui.draggable.html();
			
			$.ajax({
				url: "db_move.php",
				type: "GET",
				dataType: "json",
				data: data,
				beforeSend: function(){
					ui.draggable.html("<span>Updating...</span>");
				},
				success: function(data){
					if(data.status=='ok')
					 ui.draggable.slideUp();
					else{
					 ui.draggable.html(movieContent);
					 Ajax_error(data.code+" : "+data.msg);	
					}
				},
				error: function(XHR,Status){
					ui.draggable.html(movieContent);
				},
			});
		}
	});

//add movie----------------------------------------------------------------------
	 //load ajax page into overlay and open it 
	 $('#new-movie').click(function(event){
		$.ajax({
			dataType: 'html',
			type: 'GET',
			url: 'add_movie.php',
			success: function(data,status,XHR){
				Overlay.getOverlay().find(".contentWrap").html(data);
				Overlay.load();
			},
		});
	 });
	 
//movie description--------------------------------------------------------------------

    show_movie=function(movie_id) {
        jQuery.ajax({
            dataType: 'html',
			type: 'GET',
			url: 'show_movie.php?movie_id=' + movie_id,
			success: function(data,status,XHR){
				Overlay.getOverlay().find(".contentWrap").html(data);
				Overlay.load();
			}
        })
    }

//delete movie--------------------------------------------------------------------
   delete_movie=function (movie_id) {
	     if(confirm("Do you really want to delete this movie?")) {
	         movieContent = jQuery("#movie_" + movie_id).html();
	         jQuery.ajax({
	                      type: 'POST',
	                      url: 'db_delete_movie.php?movie_id=' + movie_id,
	                      dataType: 'json',
	                      beforeSend: function() {
	                          jQuery("#movie_" + movie_id).css("background-color", "#FFAAAA").html("<span>Deleting movie..</span>");
	                      },
	                      error: function(data, text_status, XHR) {
	                          jQuery("#movie_" + movie_id).css("background-color", "").html(movieContent);
	                      },
	                      success: function(data, text_status, XHR) {
	                          if(data.status == 'ok') {
	                              jQuery("#movie_" + movie_id).slideUp();
	                          }
	                      },
		                });
	    }
	};
	
	
//image view----------------------------------------------------------------------
$(".movie_image").live("click",function(event){
	$(this).Gallery({
		onError:function(event,error){
			$(this).Gallery.Close();
			Ajax_error(error.msg+" : "+error.src);
		},
	});
 });
 
//on load sequence----------------------------------------------------------------
	//extend jQuery object to prepare reload queue
	$.extend({
		reload: function(){
			scroll_y=$(window).scrollTop();
			$(document).queue("load",function(){
				loadCategory(this);
			}).queue("load",function(){ //insert delay for safari
				setTimeout(function(){
					$(document).dequeue("load");
				},5);
			}).queue("load",function(){
				//bind click function to sidebar active button
				$(".sidebarActive").bind("click",click_handler);
				$(".sidebarActive").click();
			}).dequeue("load");
		},
	});

	//load data on document ready
	$.reload();
 });