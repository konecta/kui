$('#tarjetasconscores').kui('cards',{
    origen : 'js/datos.json',
    id : 'pkEncuesta',
    campos : [{
            nombre : 'nombre',
            titulo: '',
            tipo: 'encabezado'
    },{
            nombre : 'fechaAlta',
            titulo: 'Creado'
    },{
            nombre : 'fechaModif',
            titulo: 'Modificado'
    },{
            nombre : 'vigenciaInicio',
            titulo: 'Vigencia',
            formato: function(campo,row){
                return campo + ' al ' + row['vigenciaFin']
            },
            tipo: 'destacado'
    },{
            nombre : 'pkEncuesta',
            titulo: 'Completas',
            tipo: 'score'
    },{
            nombre : 'empresa.pkEmpresa',
            titulo: 'Parciales',
            tipo: 'score'
    },{
            nombre : 'total',
            titulo: 'Total',
            tipo: 'score',
            formato: function(campo,row){
                return row['pkEncuesta'] + row['empresa.pkEmpresa'];
            }
    }],
    estado : function(item) {
            if (item['activo'] == 'S') {
                    return true;
            }
            return false;
    },
    onclick: click
});