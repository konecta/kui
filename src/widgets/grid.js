/*
 *
 *   +++++++++++++++++++++ Grid +++++++++++++++++++++
 *
 */

(function ($) {

    // Instances
    $.kui.instances.kgrid = {};

    // Collection method.
    $.fn.kGrid = function (data,aux) {
        return $(this).kui('grid',data,aux);
    };

    // Widget definition
    $.kui.widgets['grid'] = function (data,aux) {
        return $.kui.list.actions({
            element: this,
            constructor: KGrid,
            instances: $.kui.instances.kgrid,
            data: data,
            aux: aux
        });
    };

    var KGrid = function(div,params){
    	$.kui.list.params({
            list: this,
            div: div,
            params: params,
            rows: 10
        });
    };

    KGrid.prototype = {

        name: 'grid',

        setData: function(data){
            var kGrid = this;
            $.each(data,function(key,value){
                kGrid.data[key] = value;
            });
        },

        newGrid : function(){
            var kGrid = this;

            kGrid.haveActions = (
                kGrid.botones.length                ||
                kGrid.permisos[$.kui.i18n.add]      ||
                kGrid.permisos[$.kui.i18n.edit]     ||
                kGrid.permisos[$.kui.i18n.save]     ||
                kGrid.permisos[$.kui.i18n.activate] ||
                kGrid.permisos[$.kui.i18n.remove]
            )? true : false;

            $(kGrid.div).addClass('kui-list');

            kGrid.table = $('<table>')
                .addClass('table table-striped')
                .prependTo(
                    $('<div>')
                        // .addClass('table-responsive')
                        .prependTo(kGrid.div)
                    );

            kGrid.tbody = $('<tbody>')
                .attr('id',kGrid.div.id + '_grilla')
                .prependTo(kGrid.table);

            if(kGrid.seleccionable){
                kGrid.seleccionar(kGrid.preseleccionados);
            }

        },

        titulos: function(){
            var kGrid = this;
            kGrid.newGrid();

            if(!kGrid.showTitles){
                return;
            }

            var row = $('<tr>');
            kGrid.thead = $('<thead>').prependTo(kGrid.table);

            $.each(kGrid.campos,function(c,campo){
                var label = $('<strong>');

                if(campo.titulo!==undefined){
                    label.append(campo.titulo);
                }else{
                    label.append(campo.nombre);
                }

                // if(!campo.ancho){
                //     campo.ancho = parseInt(12/kGrid.campos.length);
                // }

                var titulo = $('<th>')
                    .html(label)
                    .appendTo(row);

                if(campo.oculto){
                    titulo.addClass('hidden');
                }

                if(kGrid.seleccionable && c===0){
                    titulo.addClass('text-center');

                    kGrid.checkall.attr('id',kGrid.div.id+'_seleccionar_todo')
                        .attr('type','checkbox')
                        .change(function(){
                            var todos = $(this).is(':checked');
                            $('.' + kGrid.div.id + '_seleccionar_row').each(function(i,item){
                                $(item).prop('checked',todos);
                                $(item).trigger('change');
                            });
                        });
                    label.html(kGrid.checkall);

                }
            });

            if(kGrid.haveActions){
              $('<th>').addClass('kacciones').appendTo(row);
            }

            row.appendTo(kGrid.thead);
        },

        load : function() {

            var kGrid = this;

            if(kGrid.tbody){
                kGrid.tbody.empty();
            }else{
                kGrid.newGrid();
            }

            var source = $.kui.data.source({
              source: kGrid.source,
              sourceAjax: kGrid.ajax,
              sourceData: kGrid.data,
              key: 'respuesta',
              message: kGrid.mensaje,
              target: kGrid.div
            });

            if(source) {
                var lista = source.datos;
                var datos = {};
                kGrid.totalDatos = parseInt(source.totalDatos);
                kGrid.pagina = parseInt(source.pagina);
                kGrid.totalPaginas = Math.ceil(kGrid.totalDatos/kGrid.data.rows);

                $.each(lista,function(i,item){
                    datos[item[kGrid.id]] = item;
                    kGrid.load_entrada(item);
                });

                $(kGrid.tbody).find('.' + kGrid.div.id + '_seleccionar_row')
                    .each(function(i,item){
                        if(kGrid.seleccionados[$(item).data('pk')]){
                            $(item).attr('checked','checked');
                        }
                        $(item).change(function(){
                            kGrid.cambiar_seleccion($(item).data('pk'),$(item).is(':checked'));
                        });
                    });

                $(kGrid.div).data('datos',datos);
                $(kGrid.div).data('totalDatos',kGrid.totalDatos);
                $(kGrid.div).data('pagina',kGrid.pagina);
                $(kGrid.div).data('totalPaginas',kGrid.totalPaginas);

                $.kui.list.reloadPager(kGrid);

            }

            if(typeof kGrid.loadComplete === 'function'){
                kGrid.loadComplete.call(this,source);
            }
        },

        load_entrada: function(item){

            var kGrid = this;
            var newRow = item===undefined;
            var pk = 'kGrid_' + kGrid.div.id + '_' +
                (newRow? ('nuevo_'+kGrid.nuevos) : item[kGrid.id]);
            var guardar = (newRow && kGrid.permisos[$.kui.i18n.add])?
                kGrid.permisos[$.kui.i18n.add] : kGrid.permisos[$.kui.i18n.save];

            if(newRow){

                if($('#'+pk).is(':visible')){
                    var newReady = true;

                    $('#'+pk).find('form').each(function(f,form){
                        newReady = newReady && $(form).valid();
                    });

                    if(newReady){
                        kGrid.nuevos++;
                        kGrid.load_entrada(item);
                    }else{
                        $('#'+pk).find('[data-rol="input"]:not([disabled],[readonly])')
                            .first().focus();
                    }

                    return;
                }

                if(guardar){
                    item = {};
                }else{
                    window.console.error('Para agregar entradas vacías debe configurar el permiso "agregar" o "guardar"');
                    return;
                }
            }

            var row = $('<tr>').attr('id',pk)
                .attr('data-pk',newRow?
                    'new-' + kGrid.nuevos + '-' + $.kui.randomId() :
                    item[kGrid.id]
                );

            var activo = newRow? true : false;

            if(newRow){
                row.attr('data-new',true);
            }else if(typeof kGrid.estado === 'function'){
                activo = kGrid.estado.call(this,item);
            }

            if(kGrid.onclick){
                var onclick = typeof kGrid.onclick === 'function'?
                    kGrid.onclick : function(){
                       window.open(kGrid.onclick,'_self');
                    };
                row.addClass('kbtn')
                    .click(function(){
                       onclick.call(this,item);
                    });
            }else if(kGrid.ondblclick){
                if( (typeof kGrid.ondblclick === 'function') ||
                    (activo && typeof kGrid.permisos[$.kui.i18n.edit] === 'function')){
                    var ondblclick = typeof kGrid.ondblclick === 'function'?
                        kGrid.ondblclick : function(){
                            kGrid.permisos[$.kui.i18n.edit].call(this,item);
                        };
                    row.dblclick(function(){
                        ondblclick.call(this,item);
                    });
                }
            }

            $.each(kGrid.campos,function(c,campo){
                var cell = $('<td>').attr('data-cell',true)
                    .data('campo',campo)
                    .appendTo(row);
                var data = $.kui.data.format(item,campo.nombre,campo.formato,campo.opciones,true);
                var view = $('<div>').attr('data-view',true)
                    .data('original',data)
                    .appendTo(cell);

                if(campo.oculto){
                    cell.addClass('hidden');
                }

                if(campo.tipo==='booleano'){

                    $.kui.form.newElement(false,view,item,campo);

                    cell.find('[data-rol=input]')
                        .prop('disabled',!campo.editonly)
                        .attr('data-pk',item[kGrid.id])
                        .dblclick(function(e){
                            e.stopPropagation();
                        });

                    cell.addClass('text-center');
                    view.removeClass('checkbox');

                }else{
                    view.html(data);
                }

            });

            if( kGrid.haveActions){
                kGrid.actions(item,pk,activo,guardar,row,newRow);
            }


            if(newRow){
                row.prependTo(kGrid.tbody);
                kGrid.enableEdit(pk,newRow);
            }else{
                row.appendTo(kGrid.tbody);
            }

        },

        cambiar_seleccion: function(codigo,estado){
            var kGrid = this;
            kGrid.seleccionados[codigo] = estado;
            kGrid.refrescar_seleccionados();
        },

        seleccionar: function(seleccionados){
            var kGrid = this;
            kGrid.seleccionados = {};
            $.each(seleccionados,function(s,seleccionado){
                kGrid.seleccionados[seleccionado] = true;
            });

            $('.' + kGrid.div.id + '_seleccionar_row').each(function(i,item){
                $(item).removeAttr('checked');
                if(kGrid.seleccionados[$(item).data('pk')]){
                    $(item).prop('checked',true);
                }
            });

            kGrid.refrescar_seleccionados();
        },

        refrescar_seleccionados: function(){
            var kGrid = this;
            var seleccionados = [];
            $.each(kGrid.seleccionados,function(codigo,estado){
                if(estado){
                    seleccionados.push(codigo);
                }
            });
            $(kGrid.div).data('seleccionados',seleccionados);

            var seleccionados_pagina_actual = $(kGrid.div)
                .find('.' + kGrid.div.id + '_seleccionar_row:checked').length;

            kGrid.checkall.prop('checked',
                seleccionados_pagina_actual>0 &&
                ($(kGrid.div).find('.' + kGrid.div.id + '_seleccionar_row').length ===
                seleccionados_pagina_actual));
        },

        agregar: function(nuevo){
            var kGrid = this;
            kGrid.load_entrada(nuevo);
        },

        enableEdit: function(pk,newRow){
            var kGrid = this;

            // Deshabilitamos ediciones anteriores
            //kGrid.load();

            // Si el formulario no existe, crearlo
            if(!$('#'+pk).data('formulario')){

                var item = $(kGrid.div).data('datos')[$('#'+pk).attr('data-pk')];

                if(!item){
                    item = {};
                }

                $('#'+pk).find('[data-cell]').each(function(c,cell) {
                    var campo = $(cell).data('campo');
                    var formItem = $('<form>').attr('data-edit',true)
                        .appendTo(cell)
                        .hide();

                    $.kui.form.newElement(false,formItem,item,campo,$('#'+pk).data('new'));

                    if(campo.tipo==='booleano'){
                        formItem.removeClass('checkbox')
                            .find('[data-rol=input]')
                            .attr('data-pk',item[kGrid.id])
                            .dblclick(function(e){
                                e.stopPropagation();
                            });
                    }

                    $.kui.form.validate.add({
                        form: formItem,
                        submit: function(/*form*/) {
                            var ready = $('#'+pk).data('ready');
                            $('#'+pk).data('ready',++ready);
                        }
                    });
                });

                $('#'+pk).data('formulario',true);
            }

            // Preservamos el ancho de la celda
            $('#'+pk).find('[data-cell]').each(function(c,cell){
                $(cell).css({
                    width: $(cell).outerWidth(),
                    height: $(cell).outerHeight()
                });
            });

            // Ocultamos la version de solo lectura
            $('#'+pk).find('[data-view]').hide();

            // Estilo de edición
            $('#'+pk).addClass('writing');

            // Habilitar edición inline
            $('#'+pk).find('[data-edit]').show();

            // Cambio de botones
            $('#'+ pk + '_editar').hide();
            if(!newRow){
                $('#'+ pk + '_remover').hide();
                $('#'+ pk + '_deshacer').fadeIn();
            }
            $('#'+ pk + '_guardar').fadeIn();

            // Focus
            $('#'+pk).find('[data-rol="input"]:not([disabled],[readonly])').first().focus();

        },

        actions: function(item,pk,active,guardar,row,newRow){
          var kGrid = this;
          var botones = $('<td>')
              .addClass('kacciones')
              .appendTo(row);
          var dimension = 'fa-lg';

          var crear_boton = function(id,titulo,icono,hover){
                  var boton = $('<a>').attr('id', pk + '_' + id)
                      .addClass('text-muted kaccion')
                      .attr('title',titulo)
                      .attr('href',$.kui.dummyLink)
                      .html('<i class="fa ' + dimension + ' fa-'+icono+'"></i>')
                      .hover( function(){ $(this).removeClass('text-muted').addClass('text-'+hover);},
                              function(){ $(this).addClass('text-muted').removeClass('text-'+hover);});
                  return boton;
              };

          var deshabilitar_edicion = function(){
              // Ocultamos la versión de edición
              $('#'+pk).find('[data-edit]').hide();
              $('#'+pk).removeClass('writing');

              // Mostramos la versión de solo lectura
              $('#'+pk).find('[data-view]').fadeIn();

              // Removemos el estilo adicional
              $('#'+pk).find('[data-cell]').removeAttr('style');

              // Cambio de botones
              $('#'+ pk + '_guardar').hide();
              $('#'+ pk + '_deshacer').hide();
              $('#'+ pk + '_editar').fadeIn();
              $('#'+ pk + '_remover').fadeIn();
          };

          var deshacer_cambios = function(){
                  deshabilitar_edicion();
                  $('#'+pk).find('[data-view]').each(function(x,view){
                      var original = $(view).data('original');
                      var input = $(view).parent().find('[data-rol=input]');
                      if($(input).attr('type')==='checkbox'){
                          $(input).prop('checked',original);
                      }else{
                          $(input).val(original);
                      }
                  });
              };

          if(active){

              var btn_editar = crear_boton('editar',$.kui.i18n.editMsg,'pencil','primary');

              if( kGrid.permisos[$.kui.i18n.edit] && !newRow &&
                  typeof kGrid.permisos[$.kui.i18n.edit] === 'function'){
                  btn_editar.click(function(e){
                      e.stopPropagation();
                      kGrid.permisos[$.kui.i18n.edit].call(this,item);
                  }).appendTo(botones);
              }else if(guardar){

                  // Guardar cambios
                  var btn_guardar = crear_boton('guardar',$.kui.i18n.saveMsg,'save','primary');
                  btn_guardar.hide();

                  var guardar_cambios = typeof guardar === 'function'?
                      function(formulario,tr){
                          guardar.call(this,formulario,tr);
                      } : function(formulario){
                          $.ajax({
                              type: 'POST',
                              url: guardar,
                              data: formulario,
                              success: function(/*retorno*/){
                                  kGrid.load();
                              }
                          });
                      };

                  btn_guardar.click(function(e){
                      e.stopPropagation();
                      $('#'+pk).data('ready',0);
                      var forms = $('#'+pk+' form');
                      forms.each(function(f,form){
                          $(form).submit();
                      });

                      if($('#'+pk).data('ready')===forms.length){

                          deshabilitar_edicion();
                          var dato = {};

                          forms.each(function(f,form){

                              var array = $(form).serializeArray();
                              var valor = '';

                              if(array.length){
                                  // Serialize Array para todos los inputs excepto checkbox
                                  $.each(array, function(_, it) {
                                      valor = dato[it.name] = it.value;
                                  });
                              }else{
                                  valor = $(form).find('[data-rol=input]').val();
                              }

                              $(form).parent().find('[data-view]').each(function(_,view) {
                                  var input = $(view).parent().find('[data-edit] [data-rol=input]');
                                  $(view).empty();

                                  if($(input).is('[type=checkbox]')){
                                      dato[$(input).attr('name')] = $(input).is(':checked');

                                      $(input).clone()
                                          .prop('disabled',true)
                                          .attr('data-pk',$(view).parent().parent().data('pk'))
                                          .appendTo(view);
                                  }else if($(input).is('select')){
                                      $(view).html($(input).find('option[value="'+valor+'"]').text());
                                  }else{
                                      $(view).html(valor);
                                  }
                              });
                          });

                          guardar_cambios(dato,$('#'+pk));

                          if($('#'+pk).data('new')){
                              $(kGrid.div).data('datos')[$('#'+pk).data('pk')] = dato;
                          }
                      }
                  }).appendTo(botones);

                  // Deshacer cambios
                  var btn_deshacer = crear_boton('deshacer','Deshacer cambios','undo','danger');
                  btn_deshacer.hide()
                      .click(function(e){
                          e.stopPropagation();
                          deshacer_cambios();
                      }).appendTo(botones);

                  // Editar (o hacer cambios)
                  if(!newRow){
                    btn_editar.appendTo(botones)
                      .click(function(e){
                          e.stopPropagation();
                          kGrid.enableEdit(pk,newRow);
                      });
                  }
              }

              if(kGrid.permisos[$.kui.i18n.remove] || newRow){
                  var btn_remover = crear_boton('remover',$.kui.i18n.removeMsg,'times','danger');

                  if(!newRow && typeof kGrid.permisos[$.kui.i18n.remove] === 'function'){
                      btn_remover.click(function(e){
                          e.stopPropagation();
                          kGrid.permisos[$.kui.i18n.remove].call(this,item);
                      });
                  }else{
                      btn_remover.click(function(e){
                          e.stopPropagation();
                          $(kGrid.div).data('datos')[$('#'+pk).data('pk')] = null;
                          delete $(kGrid.div).data('datos')[$('#'+pk).data('pk')];
                          $('#'+pk).remove();
                      });
                  }

                  btn_remover.appendTo(botones);
              }

          } else{
              if(typeof kGrid.permisos[$.kui.i18n.activate] === 'function'){
                  row.addClass('has-error');
                  var btn_activar = crear_boton('reactivar',$.kui.i18n.activateMsg,'check','success');

                  btn_activar.click(function(e){
                          e.stopPropagation();
                          kGrid.permisos[$.kui.i18n.activate].call(this,item);
                      }).appendTo(botones);
              }
          }

          if(kGrid.botones.length){

              var ubicar_boton;

              if(kGrid.botones.length < 3){
                  ubicar_boton = function(btn){
                      $(btn).appendTo(botones);
                  };
              }else{
                  var div_context = $('<div>')
                      .attr('id',$.kui.randomId())
                      .addClass('kui-dropdown')
                      .appendTo('body');

                  var ul_context = $('<ul>')
                      .attr('role','menu')
                      .addClass('dropdown-menu')
                      .appendTo(div_context);

                  var btn = crear_boton($.kui.randomId(),'Acciones','angle-down','primary');

                  btn.attr('data-toggle','dropdown')
                      .attr('aria-haspopup',true)
                      .attr('aria-expanded',false)
                      .appendTo(botones);

                  var div_dropdown = btn.parent()
                      .attr('id',$.kui.randomId())
                      .addClass('dropdown kui-dropdown');

                  var ul = ul_context.clone()
                      .attr('aria-labelledby',btn.attr('id'))
                      .appendTo(div_dropdown);

                  ubicar_boton = function(btn){
                      btn.find('i.fa').addClass('fa-fw')
                          .removeClass('fa-lg');

                      $('<span>').html(' ' + btn.attr('title'))
                          .appendTo(btn);

                      var li = $('<li>').attr('role','presentation')
                              .appendTo(ul);

                      $(btn).appendTo(li);

                      li.clone().appendTo(ul_context);
                  };

                  // Open context menu
                  $(row).attr('data-toggle','context')
                      .attr('data-target','#'+div_context.attr('id'));

                  var onShowDropdown = function(){
                      var current = this.id;
                      $('.kui-dropdown.open').each(function(d,dropdown){
                          if(dropdown.id!==current){
                              $(dropdown).removeClass('open');
                          }
                      });
                      kGrid.table.parent().addClass('kui-grid-dropdown-open');
                  };

                  div_context.on('show.bs.context',onShowDropdown);
                  div_dropdown.on('show.bs.dropdown',onShowDropdown);

                  var onHideDropdown = function(){
                      kGrid.table.parent().removeClass('kui-grid-dropdown-open');
                  };

                  div_context.on('hide.bs.context',onHideDropdown);
                  div_dropdown.on('hide.bs.dropdown',onHideDropdown);
              }

              $.each(kGrid.botones,function(b,boton){
                  if(typeof boton.mostrar !== 'function' || boton.mostrar.call(this,item)){
                      var btn = crear_boton($.kui.randomId(),boton.comentario,boton.icono,'primary');

                      btn.attr('href', (boton.enlace!==undefined)? boton.enlace : $.kui.dummyLink);

                      if(boton.onclick!==undefined){
                          btn.click(function(e){
                              e.stopPropagation();
                              boton.onclick.call(this,item);
                          });
                      }

                      if(boton.atributos!==undefined){
                          $.each(boton.atributos,function(atributo,valor){
                              btn.attr(atributo,valor);
                          });
                      }

                      ubicar_boton(btn);
                  }
              });
          }
        }

    };

}(jQuery));
