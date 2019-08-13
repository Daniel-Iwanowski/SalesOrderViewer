sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("salesorderviewer.SalesOrderViewer.controller.App", {

		onInit: function () {

			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				layout: "OneColumn",
				previousLayout: "",
				actionButtonsInfo: {
					midColumn: {
						fullScreen: false
					}
				},
				oVHCountrySetModel: null,
				oVHCurrencySetModel: null,
				oVHUnitQuantitySetModel: null,
				oVHUnitWeightSet: null,
				oVHUnitLengthSet: null		
			});
		
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
			this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this._readCountrySet(oViewModel);
			this._readCurrencySet(oViewModel);
			this._readUnitQuantitySet(oViewModel);
			this._readUnitWeightSet(oViewModel);
			this._readUnitLengthSet(oViewModel);
		},
		
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		_readCountrySet: function (oViewModel) {
			this._readODataSet(oViewModel, "/VH_CountrySet", "/oVHCountrySetModel");
		},
		
		_readCurrencySet: function (oViewModel) {
			this._readODataSet(oViewModel, "/VH_CurrencySet", "/oVHCurrencySetModel");
		},
		
		_readUnitQuantitySet: function (oViewModel) {
			this._readODataSet(oViewModel, "/VH_UnitQuantitySet", "/oVHUnitQuantitySetModel");
		},
		
		_readUnitWeightSet: function (oViewModel) {
			this._readODataSet(oViewModel, "/VH_UnitWeightSet", "/oVHUnitWeightSetModel");
		},
		
		_readUnitLengthSet: function (oViewModel) {
			this._readODataSet(oViewModel, "/VH_UnitLengthSet", "/oVHUnitLengthSetModel");
		},
		
		_readODataSet: function (oViewModel, oDataPath, propertyName) {
			var sServiceUrl = this.getOwnerComponent().getModel().sServiceUrl,
				oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl),
				oVHJSONModel = new sap.ui.model.json.JSONModel();
			oModel.read(oDataPath, {
				success: function (oData, oResponse) {
					oVHJSONModel.setData(oData);
				}
			});
			oViewModel.setProperty(propertyName, oVHJSONModel);
		}

	});
});