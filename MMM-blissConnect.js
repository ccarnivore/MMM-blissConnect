/* Magic Mirror
 * Module: MMM-blissConnect
 * a module to connect exitB blisstribute
 *
 * By Roman Robel - exitB GmbH
 *
 * MIT Licensed.
 */

Module.register("MMM-blissConnect", {
    loaded: false,
    default: {
        instance: null,
        client: null,
        username: null,
        password: null,
        refreshInterval: 30000,
        fadeTime: 3000,
        showSales: true,
        showOrders: true,
        showSendings: true
    },

    start: function() {
        var self = this;
        var dataRequest = null;
        var loaded = false;

        this.getData();
        setInterval(function() {
            self.updateDom(self.config.fadeTime);
        }, self.config.refreshInterval);
    },

    getStyles: function() {
        return ["MMM-blissConnect.css"];
    },

    getScripts: function() {
        return ["moment.js"];
    },

    _getStatsUrl: function() {
        return "https://app-" + this.config.instance + ".exitb.de/echoStatus?i=" + this.config.client +
            "&u=" + this.config.username + "&a=" + this.config.password;
    },

    getHeader: function() {
        return "BLISSTRIBUTE CONNECT - " + this.config.client + " ("+ this.config.instance + ")";
    },

    /*
     * getData
     * function example return data and show it in the module wrapper
     * get a URL request
     *
     */
    getData: function() {
        var self = this,
            retry = true,
            dataRequest = new XMLHttpRequest();

        dataRequest.open("GET", self._getStatsUrl(), true);
        dataRequest.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    console.log('stats data', this.response);
                    self.processData(JSON.parse(this.response));
                } else if (this.status === 401) {
                    self.updateDom();
                    console.error(self.name, this.status);
                    retry = false;
                } else {
                    console.error(self.name, "Could not load data.");
                }

                if (retry) {
                    self.scheduleUpdate(self.config.refreshInterval);
                }
            }
        };
        dataRequest.send();
    },

    scheduleUpdate: function(delay) {
        var nextLoad = 30000;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        setTimeout(function() {
            self.getData();
        }, nextLoad);
    },

    processData: function(data) {
        var self = this;
        this.dataRequest = data;
        this.dataRequest.timestamp = moment();
        this.updateDom(self.config.fadeTime);
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        var content = "";
        if (this.dataRequest) {
            content = "<table><tr><td class='updateTimestamp' colspan='2'>Stand " + this.dataRequest.timestamp.format("L") + " " + this.dataRequest.timestamp.format("LTS") + "</td></tr>";

            if (this.config.showSales) {
                content = content + "<tr><td colspan='2' class='section_header'>Umsatz</td></tr>" +
                    "<tr><td class='nameContainer'>Heute</td><td class='valueContainer'>" + this.dataRequest.dailyInvoiceGrossTotal + " €</td></tr>" +
                    "<tr><td class='nameContainer'>Heute (Netto)</td><td class='valueContainer'>" + this.dataRequest.dailyInvoiceNetTotal + " €</td></tr>" +
                    "<tr><td class='nameContainer'>Monat</td><td class='valueContainer'>" + this.dataRequest.monthlyInvoiceGrossTotal + " €</td></tr>" +
                    "<tr><td class='nameContainer'>Monat (Netto)</td><td class='valueContainer'>" + this.dataRequest.monthlyInvoiceNetTotal + " €</td></tr>";
            }

            if (this.config.showOrders) {
                content = content + "<tr><td colspan='2' class='section_header'>Bestellungen (Netto-Umsatz)</td></tr>" +
                    "<tr><td class='nameContainer'>Heute</td><td class='valueContainer'>" + this.dataRequest.dailyOrderCountToday + " / "+ this.dataRequest.dailyOrderTotalNetToday +" €</td></tr>" +
                    "<tr><td class='nameContainer'>Gestern</td><td class='valueContainer'>" + this.dataRequest.dailyOrderCountYesterday + " / "+ this.dataRequest.dailyOrderTotalNetYesterday +" €</td></tr>" +
                    "<tr><td class='nameContainer'>Monat</td><td class='valueContainer'>" + this.dataRequest.monthlyOrderCount + " / "+ this.dataRequest.monthlyOrderTotalNet +" €</td></tr>" +
                    "<tr><td class='nameContainer'>Vormonat</td><td class='valueContainer'>" + this.dataRequest.monthlyOrderCountBefore + " / "+ this.dataRequest.monthlyOrderTotalNetBefore +" €</td></tr>";
            }

            if (this.config.showSendings) {
                content = content + "<tr><td colspan='2' class='section_header'>Versand</td></tr>" +
                    "<tr><td class='nameContainer'>Heute</td><td class='valueContainer'>" + this.dataRequest.dailyOrderShippedCountToday + "</td></tr>" +
                    "<tr><td class='nameContainer'>Gestern</td><td class='valueContainer'>" + this.dataRequest.dailyOrderShippedCountYesterday + "</td></tr>";
            }

            content = content + "</table>";
        } else {
            content = "Lade ..."
        }

        wrapper.innerHTML = content;
        return wrapper;
    }

});
