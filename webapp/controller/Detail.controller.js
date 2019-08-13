sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment"
], function (BaseController, JSONModel, formatter, mobileLibrary, Sorter, Fragment) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("salesorderviewer.SalesOrderViewer.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				busyHTML: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			var oRouter = this.getRouter(),
				oRoute = oRouter.getRoute("detailRT"),
				oTable = this.byId("lineItemsList");

			oRoute.attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this._oTable = oTable;
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		onSelect: function (oEvent) {
			this.getRouter().navTo("orderRT", {
				partnerId: this.getView().getBindingContext().getProperty("BusinessPartnerID"),
				orderId: oEvent.getParameter("listItem").getBindingContext().getProperty("SalesOrderID")
			});
			this._removeTableRowSelection();
		},
		
		onOpenViewSettings: function (oEvent) {
			var sDialogTab = "filter";
			if (!this.byId("detailViewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "salesorderviewer.SalesOrderViewer.view.DetailViewSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("detailViewSettingsDialog").open(sDialogTab);
			}
		},

		onConfirmViewSettingsDialog: function (oEvent) {
			this._applySortGroup(oEvent);
		},
		
		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_applySortGroup: function (oEvent) {
			var mParams = oEvent.getParameters(),
				aSorters = [];
			if (mParams.sortItem) {
				var sSortPath = mParams.sortItem.getKey(),
					bSortDescending = mParams.sortDescending;
				aSorters.push(new Sorter(sSortPath, bSortDescending));
				this._oTable.getBinding("items").sort(aSorters);
			}
		},

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sPartnerId = oEvent.getParameter("arguments").partnerId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("BusinessPartnerSet", {
					BusinessPartnerID: sPartnerId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
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

			var oResourceBundle = this.getResourceBundle(),
				sBindingPath = oElementBinding.getPath(),
				oObject = oView.getModel().getObject(sBindingPath),
				sObjectId = oObject.BusinessPartnerID,
				sObjectName = oObject.CompanyName;

			this.getOwnerComponent().oListSelector.selectAListItem(sBindingPath);

			this.getModel("detailView").setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubjectDetail", [sObjectId]));
			this.getModel("detailView").setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessageDetail", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			this._adjustFullScreen();
			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			oViewModel.setProperty("/busyHTML", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("masterRT");
		},

		_removeTableRowSelection: function () {
			var lineItemTable = this.byId("lineItemsList");
			if (lineItemTable) {
				lineItemTable.removeSelections();
			}
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
		},

		onAfterHTMLRendering: function () {
			var oDetailViewModel = this.getModel("detailView");
			if (oDetailViewModel) {
				oDetailViewModel.setProperty("/busyHTML", false);
			}
		}

	});

});