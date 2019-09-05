(function ($) {
	$.fn.extend({
		faceMocion: function (opciones) {
			var faceMocion = this;
			var NombreSelector = "Selector";
			var DescripcionFace = "--";
			defaults = {
				emociones: [{
					"emocion": "amo",
					"TextoEmocion": "Lo amo"
				}, {
					"emocion": "molesto",
					"TextoEmocion": "Me molesta"
				}, {
					"emocion": "asusta",
					"TextoEmocion": "Me asusta"
				}, {
					"emocion": "divierte",
					"TextoEmocion": "Me divierte"
				}, {
					"emocion": "gusta",
					"TextoEmocion": "Me gusta"
				}, {
					"emocion": "triste",
					"TextoEmocion": "Me entristece"
				}, {
					"emocion": "asombro",
					"TextoEmocion": "Me asombra"
				}, {
					"emocion": "alegre",
					"TextoEmocion": "Me alegra"
				}],
				callback: function () {
					//callbackhere
				}
			};
			var opciones = $.extend({}, defaults, opciones);

			$(faceMocion).each(function (index) {
				var UnicoID = Date.now();
				$(this).attr("class", $(faceMocion).attr("class") + " " + UnicoID);
				var EstadoInicial = "alegre";
				if ($(this).val() != "") {
					EstadoInicial = $(this).val();
				} else {
					$(this).val('alegre');
				}
				DescripcionFace = EstadoInicial;
				$(this).attr("id-referencia", UnicoID);
				// ElementoIniciar = '';
				// ElementoIniciar = ElementoIniciar + '<div dato-descripcion="' + DescripcionFace + '" ';
				// ElementoIniciar = ElementoIniciar + 'id-referencia="' + UnicoID;
				// ElementoIniciar = ElementoIniciar + '"  class="' + NombreSelector;
				// ElementoIniciar = ElementoIniciar + ' selectorFace ' + EstadoInicial + '"></div>';
				//$(this).before(ElementoIniciar);
				$(this).addClass(NombreSelector);
			});


			$(document).ready(function () {
				// BarraEmociones = '<div class="faceMocion">';
				// $.each(opciones.emociones, function (index, emo) {
				// 	BarraEmociones = BarraEmociones + '<div dato-descripcion="' + emo.TextoEmocion;
				// 	BarraEmociones = BarraEmociones + '" class="' + emo.emocion + '"></div>';
				// });
				// BarraEmociones = BarraEmociones + '</div>';
				//$(document.body).append(BarraEmociones);
				$('.faceMocion div').hover(function () {
					var title = $(this).attr('dato-descripcion');
					$(this).data('tipText', title).removeAttr('dato-descripcion');
					$('<p class="MensajeTexto"></p>').text(title).appendTo('body').fadeIn('slow');
				}, function () {
					$(this).attr('dato-descripcion', $(this).data('tipText'));
					$('.MensajeTexto').remove();
				})
					.mousemove(function () {
						var RatonX = e.pageX - 20;
						var RatonY = e.pageY - 60;
						$('.MensajeTexto').css({
							top: RatonY,
							left: RatonX
						})
					});
			});
			$('.' + NombreSelector).hover(function (e) {
				SelectorEmocion = $(this);
				// var RatonX = e.pageX - 20;
				// var RatonY = e.pageY - 60;
				// $(".faceMocion").css({
				// 	top: RatonY,
				// 	left: RatonX
				// });
				// $(".faceMocion").show();
				clearTimeout($(this).data('timeoutId'))
				add(e);
			}).mouseleave(function(){
				hideIconsTooltip();				
			});;
			$(document).on("mouseenter", ".faceMocion", function () {
				clearTimeout($(SelectorEmocion).data('timeoutId'))
			});
			$(document).on("mouseleave", ".faceMocion", function () {
				hideIconsTooltip();
			});

			function hideIconsTooltip(){
				var elem = $(SelectorEmocion),
				timeoutId = setTimeout(function(){
					elem.closest('.like-box').find(".faceMocion").fadeOut("slow");
				}, 650);
			elem.data('timeoutId', timeoutId); 
			}

			$(document).on("click", ".faceMocion div", function () {
				//SelectorEmocion.attr("class", NombreSelector + " selectorFace  " + $(this).attr('class'));

				ElInputSeleccionado = SelectorEmocion.attr("id-referencia");
				//$("." + ElInputSeleccionado).val($(this).attr('class'));

				SelectorEmocion.attr('aria-pressed',true);

				if (typeof opciones.callback == "function") {
					opciones.callback(this);
					var cls_name = ''
					switch ($(this).attr('class')) {
						case 'gusta':
							cls_name = 'like'
							changeCss(SelectorEmocion, 'fa like-icon', 'rgb(64, 128, 255)')
							break;
						case 'amo':
							cls_name = 'love'
							changeCss(SelectorEmocion, 'fa love-icon', 'rgb(242, 82, 104)')
							break;
						case 'divierte':
							cls_name = 'haha'
							changeCss(SelectorEmocion, 'fa haha-icon', 'rgb(240, 186, 21)')
							break;
						default:
							cls_name = 'like'
					}

					let un_selected = false;

					var text = cls_name.toLowerCase().replace(/\b[a-z]/g, function (letter) {
						return letter.toUpperCase();
					});
					
					SelectorEmocion.get(0).lastChild.nodeValue = " " + text;

					SelectorEmocion.trigger('itemSelected', cls_name)
				}
			});
			$(document).mouseup(function (e) {
				$(".faceMocion").hide();
			});

			function changeCss(element, cls_name, color) {				
					element.css("color", color)
					element.find('i').attr('class', cls_name);
			}

			 function add(){
				var $like_box = $(SelectorEmocion).closest('.like-box')
				if($like_box.find('.faceMocion').length<=0){
				 	BarraEmociones = '<div class="faceMocion">';
					$.each(opciones.emociones, function (index, emo) {
						BarraEmociones = BarraEmociones + '<div dato-descripcion="' + emo.TextoEmocion;
						BarraEmociones = BarraEmociones + '" class="' + emo.emocion + '"></div>';
					});
					BarraEmociones = BarraEmociones + '</div>';					
					$like_box.append(BarraEmociones);
				}
			 let $faceMocion= $like_box.find('.faceMocion')
			 var position = $(SelectorEmocion).position();
			
			 $faceMocion.css({
				top: position.top - 60,
				left: position.left-20
			});
			$faceMocion.show();
			 }
			//$(faceMocion).hide();

		}
	});
})(jQuery);