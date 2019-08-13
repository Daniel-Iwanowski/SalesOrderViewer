sap.ui.define([], function () {
	"use strict";

	return {

		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}
			var sParts = parseFloat(sValue).toFixed(2).toString().split(".");
			sParts[0] = sParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
			return sParts.join(",");
		},

		formatInteractiveMap: function (sStreet, sBuilding, sCity, sPostalCode, sCountry) {
			var vHTML1 = "<iframe height='99%' width='100%' marginheight='0' marginwidth='0' frameborder='0' src='",
				vHTML2 = "'>HERE maps not available!</iframe>",
				vURL = "./html/map.html",
				sParam1,
				sParam2,
				sParam3,
				sParam4,
				sParam5,
				sFullPath;

			sParam1 = (sStreet === null) ? "" : jQuery.sap.encodeURL(sStreet);
			sParam2 = (sBuilding === null) ? "" : jQuery.sap.encodeURL(sBuilding);
			sParam3 = (sCity === null) ? "" : jQuery.sap.encodeURL(sCity);
			sParam4 = (sPostalCode === null) ? "" : jQuery.sap.encodeURL(sPostalCode);
			sParam5 = (sCountry === null) ? "" : jQuery.sap.encodeURL(sCountry);

			if (sParam2 !== "") {
				sParam1 = jQuery.sap.encodeURL(sStreet + " " + sBuilding);
			}
			if (sParam4 !== "") {
				sParam3 = jQuery.sap.encodeURL(sPostalCode + " " + sCity);
			}

			sFullPath = vHTML1 + vURL +
				"?Street=" + sParam1 +
				"&City=" + sParam3 +
				"&Country=" + sParam5 +
				vHTML2;
			return sFullPath;
		},

		salesOrderNumber: function (sValue) {
			return parseInt(sValue, 10);
		},

		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		businessPartnerOrdersCount: function (sPartnerID) {
			var oMasterModel = this.getModel("masterView"),
				currentPath = "/BusinessPartnerSet(BusinessPartnerID='" + sPartnerID + "')",
				listBindingContextPath = "/BusinessPartnerSet('" + sPartnerID + "')";
			if (oMasterModel) {
				var sServiceUrl = this.getOwnerComponent().getModel().sServiceUrl,
					oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl),
					countPath = currentPath + "/ToSalesOrders/$count";
				oModel.read(countPath, {
					success: function (oData, oResponse) {
						var listItems = oMasterModel.getProperty("/list").getItems();
						if (listItems) {
							var foundListItem = listItems.find(function (oListItem) {
								return oListItem.getBindingContextPath() === listBindingContextPath;
							});
							if (foundListItem) {
								var number = parseInt(oData, 10);
								if (number > 0) {
									foundListItem.setCounter(number);
									foundListItem.setUnread(true);
								} else {
									foundListItem.setCounter(0);
									foundListItem.setUnread(false);
								}
							}
						}
					}
				});
			}
			return sPartnerID;
		},

		countryName: function (sCountry) {
			var oVHCountrySetModel = this.getModel("appView").getProperty("/oVHCountrySetModel"),
				sResult;
			sResult = sCountry;
			if (oVHCountrySetModel) {
				var countries = oVHCountrySetModel.getData().results;
				if (countries) {
					var foundCountry = countries.find(function (country) {
						return country.Land1 === sCountry;
					});
					if (foundCountry) {
						sResult = foundCountry.Landx;
					}
				}
			}
			return sResult;
		},

		currencyName: function (sCurrency) {
			var oVHCurrencySetModel = this.getModel("appView").getProperty("/oVHCurrencySetModel"),
				sResult;
			sResult = sCurrency;
			if (oVHCurrencySetModel) {
				var currList = oVHCurrencySetModel.getData().results;
				if (currList) {
					var foundCurrency = currList.find(function (currency) {
						return currency.Waers === sCurrency;
					});
					if (foundCurrency) {
						sResult = foundCurrency.Ltext;
					}
				}
			}
			return sResult;
		},

		unitQuantityName: function (sUnit) {
			var oVHUnitQuantitySetModel = this.getModel("appView").getProperty("/oVHUnitQuantitySetModel"),
				sResult;
			sResult = sUnit;
			if (oVHUnitQuantitySetModel) {
				var unitList = oVHUnitQuantitySetModel.getData().results;
				if (unitList) {
					var foundUnit = unitList.find(function (unit) {
						return unit.Msehi === sUnit;
					});
					if (foundUnit) {
						sResult = foundUnit.Msehl;
					}
				}
			}
			return sResult;
		},

		unitWeightName: function (sUnit) {
			var oVHUnitWeightSetModel = this.getModel("appView").getProperty("/oVHUnitWeightSetModel"),
				sResult;
			sResult = sUnit;
			if (oVHUnitWeightSetModel) {
				var unitList = oVHUnitWeightSetModel.getData().results;
				if (unitList) {
					var foundUnit = unitList.find(function (unit) {
						return unit.Msehi === sUnit;
					});
					if (foundUnit) {
						sResult = foundUnit.Msehl;
					}
				}
			}
			return sResult;
		},

		unitLengthName: function (sUnit) {
			var oVHUnitLengthSetModel = this.getModel("appView").getProperty("/oVHUnitLengthSetModel"),
				sResult;
			sResult = sUnit;
			if (oVHUnitLengthSetModel) {
				var unitList = oVHUnitLengthSetModel.getData().results;
				if (unitList) {
					var foundUnit = unitList.find(function (unit) {
						return unit.Msehi === sUnit;
					});
					if (foundUnit) {
						sResult = foundUnit.Msehl;
					}
				}
			}
			return sResult;
		},

		messageIsNotEmpty: function (sMessage) {
			if (sMessage) {
				return true;
			} else {
				return false;
			}
		}

	};

});