sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"../model/formatter",
	"sap/m/library"
], function (BaseController, JSONModel, History, formatter, mobileLibrary) {
	"use strict";

	return BaseController.extend("salesorderviewer.SalesOrderViewer.controller.Order", {

		formatter: formatter,
		productDetailsDialog: null,
		supllierDetailsPopover: null,

		onInit: function () {

			var oViewModel = new JSONModel({
				busy: false,
				dialogBusy: false,
				dialogStretch: this.getOwnerComponent().getModel("device").getProperty("/system/phone"),
				popoverBusy: false,
				delay: 0,
				sPartnerId: "",
				orderItemsTitle: this.getResourceBundle().getText("orderLineItemTableHeading"),
				orderViewTitle: "", // Content will be updated later basing on the binding context
				orderHeaderTitle: this.getResourceBundle().getText("orderLineHeaderTableHeading"),
				orderHeaderTab: [], // Order header data sill be stored here
				orderNoteText: this.getResourceBundle().getText("orderLineHeaderTableDefaultNote")
			});

			var oRouter = this.getRouter(),
				oRoute = oRouter.getRoute("orderRT");

			oRoute.attachPatternMatched(this._onRouteMatched, this);
			this.setModel(oViewModel, "orderView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("orderView");

			// only update the counter if the length is final
			if (this.byId("orderItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("orderLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("orderLineItemTableHeading");
				}
				oViewModel.setProperty("/orderItemsTitle", sTitle);
			}
		},

		onSendEmailPress: function () {
			var oViewModel = this.getModel("orderView");

			mobileLibrary.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		onURLClick: function (oEvent) {
			var sURL = oEvent.getSource().getProperty("title");
			window.open(sURL, "_blank");
		},

		onEmailClick: function (oEvent) {
			var sEmail = oEvent.getSource().getProperty("title");
			mobileLibrary.URLHelper.triggerEmail(sEmail, null, null);
		},

		_onRouteMatched: function (oEvent) {
			var sOrderId = oEvent.getParameter("arguments").orderId;

			this.getModel("orderView").setProperty("/busy", false);
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("SalesOrderSet", {
					SalesOrderID: sOrderId
				});
				this.getView().bindElement({
					path: "/" + sObjectPath,
					events: {
						change: this._onBindingChange.bind(this),
						dataRequested: function () {
							this.getModel("orderView").setProperty("/busy", true);
						},
						dataReceived: function () {
							this.getModel("orderView").setProperty("/busy", false);
						}
					}
				});
			}.bind(this));
			this.getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		_updateViewTitle: function () {
			var oBindingContext = this.getView().getBindingContext(),
				oViewModel = this.getModel("orderView");

			if (oBindingContext && oViewModel) {
				var sCustomerName = oBindingContext.getProperty("CustomerName"),
					sSalesOrderID = oBindingContext.getProperty("SalesOrderID");
				if (sCustomerName === null) {
					sCustomerName = "";
				}
				if (sSalesOrderID === null) {
					sSalesOrderID = "";
				}
				oViewModel.setProperty("/orderViewTitle",
					this.getResourceBundle().getText("orderTitleHeading", [
						sCustomerName,
						formatter.salesOrderNumber(sSalesOrderID)
					])
				);
				oViewModel.setProperty("/orderHeaderTitle",
					this.getResourceBundle().getText("orderLineHeaderTableHeadingNum", [
						formatter.salesOrderNumber(sSalesOrderID)
					])
				);
			}
		},

		_prepareOrderHeader: function () {
			var oBindingContext = this.getView().getBindingContext(),
				oViewModel = this.getModel("orderView");

			if (oBindingContext && oViewModel) {
				var parameters = {
						SalesOrderID: oBindingContext.getProperty("SalesOrderID"),
						GrossAmount: oBindingContext.getProperty("GrossAmount"),
						NetAmount: oBindingContext.getProperty("NetAmount"),
						TaxAmount: oBindingContext.getProperty("TaxAmount"),
						CurrencyCode: oBindingContext.getProperty("CurrencyCode")
					},
					sNote = oBindingContext.getProperty("Note");

				if (parameters.SalesOrderID === null) {
					parameters.SalesOrderID = "";
				}
				if (parameters.GrossAmount === null) {
					parameters.GrossAmount = 0;
				}
				if (parameters.NetAmount === null) {
					parameters.NetAmount = 0;
				}
				if (parameters.TaxAmount === null) {
					parameters.TaxAmount = 0;
				}
				if (parameters.CurrencyCode === null) {
					parameters.CurrencyCode = "";
				}

				oViewModel.setProperty("/orderHeaderTab", [parameters]);
				if (sNote === null || sNote === "") {
					sNote = this.getResourceBundle().getText("orderLineHeaderTableDefaultNote");
				}
				oViewModel.setProperty("/orderNoteText", sNote);
			}
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sPartnerId = oObject.CustomerID,
				sObjectId = oObject.SalesOrderID,
				sPartnerListPath = "/BusinessPartnerSet('" + sPartnerId + "')",
				oViewModel = this.getModel("orderView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPartnerListPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubjectOrder", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessageOrder", [sObjectId, location.href]));
			oViewModel.setProperty("/sPartnerId", sPartnerId);
			this._updateViewTitle();
			this._prepareOrderHeader();
		},

		_onMetadataLoaded: function () {
			this._updateViewTitle();
			this._adjustFullScreen();
		},

		onCloseDetailPress: function () {
			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oViewModel = this.getModel("orderView"),
				sPartnerId;

			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			this.getModel().deleteCreatedEntry(this._oContext);

			sPartnerId = oViewModel.getProperty("/sPartnerId");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("detailRT", {
					partnerId: sPartnerId
				}, bReplace);
			}
		},

		onShowDialog: function (oEvent) {
			var oDialog = this._getDialog(),
				sPath = oEvent.getSource().getBindingContext().getPath() + "/ToProduct";

			this.getModel("orderView").setProperty("/dialogBusy", false);
			oDialog.bindElement(sPath, {
				expand: "ToSupplier"
			});
			oDialog.open();
		},

		onAfterOpenDialog: function (oEvent) {
			if (this.productDetailsDialog) {
				this.getModel("orderView").setProperty("/dialogBusy", false);
			}
		},

		onBeforeOpenDialog: function (oEvent) {
			if (this.productDetailsDialog) {
				this.getModel("orderView").setProperty("/dialogBusy", true);
			}
		},

		onBeforeOpenPopover: function (oEvent) {
			if (this.supllierDetailsPopover) {
				this.getModel("orderView").setProperty("/popoverBusy", true);
			}
		},

		onAfterOpenPopover: function (oEvent) {
			if (this.supllierDetailsPopover) {
				this.getModel("orderView").setProperty("/popoverBusy", false);
			}
		},

		onCloseDialog: function (oEvent) {
			if (this.productDetailsDialog) {
				this.productDetailsDialog.close();
			}
		},

		_getDialog: function () {
			if (!this.productDetailsDialog) {
				this.productDetailsDialog = sap.ui.xmlfragment("salesorderviewer.SalesOrderViewer.view.ProductDetailDialog", this);
				this.getView().addDependent(this.productDetailsDialog);
			}
			return this.productDetailsDialog;
		},

		_getSupplierPopover: function () {
			if (!this.supllierDetailsPopover) {
				this.supllierDetailsPopover = sap.ui.xmlfragment("salesorderviewer.SalesOrderViewer.view.SupplierPopover", this);
				this.getView().addDependent(this.supllierDetailsPopover);
			}
			return this.supllierDetailsPopover;
		},

		onShowSupplierPopover: function (oEvent) {
			var oPopover = this._getSupplierPopover(),
				sPath = oEvent.getSource().getBindingContext().getPath(),
				oOpener = sap.ui.getCore().byId("idSupplierDetailsHeader").getDomRef();
			this.getModel("orderView").setProperty("/popoverBusy", false);
			oPopover.bindElement(sPath, {
				expand: "ToSupplier"
			});
			oPopover.openBy(oOpener);
		},

		_adjustFullScreen: function () {
			var appViewModel = this.getModel("appView"),
				bFullScreen;
			if (appViewModel) {
				bFullScreen = appViewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
				appViewModel.setProperty("/previousLayout", appViewModel.getProperty("/layout"));
				if (bFullScreen) {
					appViewModel.setProperty("/layout", "MidColumnFullScreen");
				} else {
					appViewModel.setProperty("/layout", "TwoColumnsMidExpanded");
				}
			}
		},

		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			this._adjustFullScreen();
		}

	});
});