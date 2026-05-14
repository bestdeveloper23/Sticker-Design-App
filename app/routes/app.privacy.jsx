export default function PrivacyPage() {
  return (
    <s-page heading="Privacy Policy">

      <s-section heading="Overview">
        <s-paragraph>
          Custom Sticker App is committed to protecting your privacy and the
          privacy of your customers. This policy explains what data we collect,
          how we use it, and how we keep it safe.
        </s-paragraph>
      </s-section>

      <s-section heading="What Data We Collect">
        <s-unordered-list>
          <s-list-item>
            <strong>Shop data:</strong> Your Shopify store URL and access token
            to authenticate and run the app.
          </s-list-item>
          <s-list-item>
            <strong>Customer data:</strong> Customer ID and email passed to the
            sticker designer to associate saved designs with a customer.
          </s-list-item>
          <s-list-item>
            <strong>Order data:</strong> Sticker design references, sizes,
            quantities, and design URLs saved as order line item properties.
          </s-list-item>
          <s-list-item>
            <strong>Design data:</strong> Uploaded images and completed design
            files stored by the sticker designer service.
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section heading="How We Use Your Data">
        <s-unordered-list>
          <s-list-item>
            To authenticate your store and run the app securely.
          </s-list-item>
          <s-list-item>
            To create draft orders for custom sticker sizes and quantities.
          </s-list-item>
          <s-list-item>
            To allow customers to save and reuse their sticker designs.
          </s-list-item>
          <s-list-item>
            To display design previews on the cart page.
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section heading="Data Retention">
        <s-paragraph>
          Session data is stored securely in our database and is removed when
          the app is uninstalled from your store. Customer design data is
          retained by the sticker designer service and subject to their
          retention policy.
        </s-paragraph>
      </s-section>

      <s-section heading="Third Party Services">
        <s-paragraph>
          This app uses the external sticker designer service to handle design
          creation and storage. Please review their privacy policy for
          information on how your customers' design data is handled.
        </s-paragraph>
      </s-section>

      <s-section heading="Your Rights">
        <s-paragraph>
          You may request deletion of your store's data at any time by
          uninstalling the app or contacting us directly. Customer data deletion
          requests can be submitted through Shopify's data request system.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Contact">
        <s-paragraph>
          If you have any privacy-related questions, please contact the app
          developer through the Shopify App Store listing.
        </s-paragraph>
      </s-section>

    </s-page>
  );
}