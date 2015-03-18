(function () {
    var V = envision;
    
    //Custom data processor
    function processData (options) {
        var resolution = options.resolution;
    
        options.preprocessor
            .bound(options.min, options.max)
            .subsampleMinMax(resolution + Math.round(resolution / 3));
    }
    
    function getPriceDefaults () {
        return {            
            price: {
                name: 'envision-finance-price',
                config: {                    
                    'lite-lines': {
                        lineWidth: 1,
                        show: true,
                        fillOpacity: 1,
                        fillBorder: true
                    }
                    //mouse: {
                    //    track: true,
                    //    trackY: false,
                    //    trackAll: true,
                    //    sensibility: 1,
                    //    trackDecimals: 4,
                    //    position: 'ne'
                    //}
                },
                processData: processData
            }
        };
    }
    
    function getVolumeDefaults() {
        return {    
            volume : {
                name: 'envision-finance-volume',
                config: {
                    whiskers: {
                        show: true,
                        fill: true
                    },
                    yaxis: {
                        autoscale: true,
                        noTicks : 2,
                        showLabels: true
                    },
                    grid: {
			horizontalLines: true,
			verticalLines: false
		    }
                },
                processData: processData
            }
        }
    }

    function PriceChart(options) {
        var vis = new V.Visualization({name : 'envision-finance'}),
            price, defaults;
    
        defaults = setPriceDefaults(options);
        price = new V.Component(defaults.price);
      
        //Render visualization.
        vis.add(price).render(options.container);        
      
        this.vis = vis;
        this.price = price;
	//Issue 794
        //this.redraw = function(options) {
        //    var defaults = setPriceDefaults(options);
        //    
        //    this.price.draw(options.data.price, defaults.price.config);
        //}
    }
    
    function setPriceDefaults(options) {
        var data = options.data,
            defaults = getPriceDefaults();
        
        if (options.defaults) {
            defaults = Flotr.merge(options.defaults, defaults);
        }
      
        defaults.price.data = data.price;      
        //defaults.price.config.mouse.trackFormatter = options.trackFormatter;
        
        //if (options.xTickFormatter) {
        //    defaults.price.config.xaxis.tickFormatter = options.xTickFormatter;
        //}
        //
        //if (options.yTickFormatter) {
        //    defaults.price.config.yaxis.tickFormatter = options.yTickFormatter;
        //}
        //
        //defaults.price.config.yaxis.tickFormatter = options.yTickFormatter || function (n) {
        //    return n;
        //};
        
        return defaults;
    }
    
    function VolumeChart(options) {
        var vis = new V.Visualization({name : 'envision-finance'}),
            volume, defaults;

	defaults = setVolumeDefaults(options);
        volume = new V.Component(defaults.volume);
      
        //Render visualization.
        vis.add(volume).render(options.container);
      
        this.vis = vis;
        this.volume = volume;
    }
    
    function setVolumeDefaults(options) {
        var data = options.data,
            defaults = getVolumeDefaults();
        
        if (options.defaults) {
            defaults = Flotr.merge(options.defaults, defaults);
        }
      
       defaults.volume.data = data.volume;      
        
        if (options.yTickFormatter) {
            defaults.volume.config.yaxis.tickFormatter = options.yTickFormatter;
        }
        
        return defaults;
    }
      
    V.templates.PriceChart = PriceChart;
    V.templates.VolumeChart = VolumeChart;
})();