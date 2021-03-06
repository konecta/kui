/*
 *
 *   +++++++++++++++++++++ Form +++++++++++++++++++++
 *
 */

(function ($) {

    $.kui.instances.kform = {};

    // Collection method.
    $.fn.kForm = function (data) {
        return $(this).kui('form',data);
    };

    // Widget definition
    $.kui.widgets['form'] = function (data) {
        return $.kui.instances.kform[this.id] = new KForm(this,data);
    };

    var KForm = function(div,dato){

        /*
         * Si no se provee algun campo obligatorio,
         * no se puede continuar.
        */

        if( dato.campos===undefined || dato.submit===undefined){
            window.console.error('Los parámetros "campos" y "submit" son obligatorios.');
            return;
        }

        this.div = div;
        this.campos = dato.campos;
        this.submit = dato.submit;
        this.origen = dato.origen;
        this.ajax_origen = dato.ajaxOrigen===undefined? 'GET' : dato.ajaxOrigen;
        this.ajax_submit = dato.ajaxSubmit===undefined? 'POST' : dato.ajaxSubmit;
        this.loadComplete = dato.loadComplete;
        this.boton_submit = dato.botonSubmit;
        this.readOnly = dato.soloLectura===undefined? false : dato.soloLectura;
        this.data_origen = dato.dataOrigen;
        this.after_submit = dato.afterSubmit;
        this.columnas = dato.columnas;

        this.load();

    };

    KForm.prototype = {

        nuevo_form : function(){
            var kForm = this;
            kForm.form = $('<form>').attr('id',kForm.div.id + '_form')
                    .addClass('kform form-horizontal')
                    .attr('action','#')
                    .prependTo(kForm.div);
        },

        load : function() {

            var kForm = this;
            if(kForm.form){
                kForm.form.empty();
            }else{
                kForm.nuevo_form();
            }

            kForm.dato = $.kui.data.source({
              source: kForm.origen,
              sourceAjax: kForm.ajax_origen,
              sourceData: kForm.data_origen,
              key: 'objeto',
              target: kForm.div
            });
            kForm.load_campos();
        },

        load_campos : function(){

            var kForm = this;
            var item = kForm.dato;

            var columnas = kForm.columnas ? kForm.columnas : 1;
            var anchoColumna = Math.ceil(12 / columnas);
            var variasColumnas = columnas > 1;

            kForm.fieldset = $('<fieldset>').appendTo(kForm.form);
            if(kForm.readOnly){
                kForm.fieldset.attr('disabled',true);
            }

            $.each(kForm.campos,function(c,campo){
                var formGroup = $('<div>')
                    .addClass('form-group' + (campo.oculto? ' hidden' : '') + (variasColumnas? ' col-md-'+anchoColumna : ''))
                    .appendTo(kForm.fieldset);

                if(campo.titulo===undefined){
                    campo.titulo = campo.nombre;
                }

                /*
                 * Lado izquierdo: Label
                 */
                $('<label>').addClass('klabel col-sm-4 control-label')
                    .html(campo.titulo)
                    .appendTo(formGroup);

                /*
                 * En el centro: Input
                 */
                var centro = $('<div>').addClass('col-sm-8')
                    .appendTo(formGroup);

                $.kui.form.newElement(kForm.readOnly,centro,item,campo);
            });

            $(kForm.div).data('dato',kForm.dato);

            kForm.funcion_submit();

            if(typeof kForm.loadComplete === 'function'){
                kForm.loadComplete.call(this,kForm.dato);
            }

        },

        funcion_submit: function(){
            var kForm = this;

            if(kForm.boton_submit===undefined){
                kForm.boton_submit = $('<button>').addClass('btn btn-primary')
                    .html($.kui.i18n.saveMsg)
                    .appendTo(
                        $('<div>').addClass('form-group text-right')
                            .appendTo(kForm.fieldset)
                    );
            }else{
                kForm.boton_submit = $(kForm.boton_submit);
            }

            kForm.boton_submit.click(function(e){
                e.preventDefault();
                kForm.form.submit();
            });

            var afterSubmit = typeof kForm.after_submit === 'function'?
                function(retorno){
                    kForm.after_submit.call(this,retorno);
                }:function(){};

            var on_submit = typeof kForm.submit === 'function'?
                function(content){
                    afterSubmit(kForm.submit.call(this,content,kForm.dato));
                } : function(content){

                    $.ajax({
                        type: kForm.ajax_submit,
                        url: kForm.submit,
                        data: content,
                        success: function(retorno){
                            if(retorno.mensaje){
                                $.kui.messages(kForm.mensaje,kForm.div,retorno.tipoMensaje,retorno.mensaje);
                            }
                            afterSubmit(retorno);
                        },
                        async: false
                    });

                };

            $.kui.form.validate.add({
                form: kForm.form,
                submit: function(/*form*/) {
                  var content = kForm.contenido();
                  if(typeof kForm.beforeSubmit === 'function'){
                      kForm.beforeSubmit.call(this,content,kForm.dato);
                  }
                  on_submit(content);
                }
            });

        },

        contenido: function(){
            var kForm = this;
            var dato = {};

            // Serialize Array para todos los inputs excepto checkbox
            $.each(kForm.form.serializeArray(),function(_, it) {
                dato[it.name] = it.value;
            });

            // Checkboxs
            $.each(kForm.form.find('input[data-rol=input][type=checkbox]'),function(_, checkbox) {
                dato[$(checkbox).attr('name')] = $(checkbox).is(':checked');
            });

            return dato;
        }

    };

}(jQuery));
