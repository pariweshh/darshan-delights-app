// app/(tabs)/more/help/faqs.tsx

import React, { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import Wrapper from "@/src/components/common/Wrapper"
import Accordion from "@/src/components/ui/Accordion"
import AppColors from "@/src/constants/Colors"
import { useResponsive } from "@/src/hooks/useResponsive"

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface FAQSection {
  title: string
  items: FAQItem[]
}

const FAQ_DATA: FAQSection[] = [
  {
    title: "General Questions",
    items: [
      {
        id: "g1",
        question: "Where is your store located?",
        answer:
          "We operate primarily online but offer local pickup from 8 Lethbridge Road, Austral, NSW 2179, Australia. Our pickup hours are Mon-Fri 5PM-8PM and Sat-Sun 9AM-5PM.",
      },
      {
        id: "g2",
        question: "How can I contact Darshan Delights?",
        answer:
          "You can reach us via phone (+61 452 550 534), email (contact@darshandelights.com.au), WhatsApp, or through our Contact Us page. Our customer service team is here to assist you with any enquiries.",
      },
      {
        id: "g3",
        question: "Do I need an account to place an order?",
        answer:
          "Yes, creating an account is required to place orders. This allows you to track orders, view order history, save addresses, and receive personalized offers.",
      },
      {
        id: "g4",
        question: "How do I create an account?",
        answer:
          "Tap 'Sign Up' on the login screen, enter your name, email address, and create a password. You'll receive a verification email to confirm your account. Once verified, you can start shopping!",
      },
      {
        id: "g5",
        question: "I forgot my password. How do I reset it?",
        answer:
          "On the login screen, tap 'Forgot Password?' and enter your email address. We'll send you a password reset link. Check your spam folder if you don't see it within a few minutes.",
      },
    ],
  },
  {
    title: "Account & Profile",
    items: [
      {
        id: "a1",
        question: "How do I update my profile information?",
        answer:
          "Go to More > My Profile to update your name, email, phone number, and profile picture. Tap 'Edit Profile' to make changes and save when done.",
      },
      {
        id: "a2",
        question: "How do I manage my delivery addresses?",
        answer:
          "Go to More > Addresses to view, add, edit, or delete your saved addresses. You can set a default address that will be automatically selected during checkout.",
      },
      {
        id: "a3",
        question: "How do I change my password?",
        answer:
          "Go to More > Settings > Change Password. Enter your current password and then your new password twice to confirm. Your new password must be at least 8 characters.",
      },
      {
        id: "a4",
        question: "Can I enable biometric login (Face ID/Fingerprint)?",
        answer:
          "Yes! Go to More > Settings and enable 'Biometric Login'. Once enabled, you can use Face ID or fingerprint to quickly sign in instead of entering your password.",
      },
      {
        id: "a5",
        question: "How do I delete my account?",
        answer:
          "Go to More > Settings > Delete Account. Please note this action is permanent and will delete all your data including order history, saved addresses, favorites, and reviews. Contact support if you need assistance.",
      },
    ],
  },
  {
    title: "Shopping & Products",
    items: [
      {
        id: "s1",
        question: "How do I search for products?",
        answer:
          "Tap the Search tab to find products by name, category, or brand. Your recent searches are saved for quick access. You can also browse by category in the Products tab.",
      },
      {
        id: "s2",
        question: "How do I add items to my favorites?",
        answer:
          "Tap the heart icon on any product card or product detail page to add it to your favorites. Access your favorites anytime from the Favorites tab to quickly find and reorder products you love.",
      },
      {
        id: "s3",
        question: "What is the 'Purchased Before' section?",
        answer:
          "This feature shows all products you've previously ordered, making it easy to reorder your favorites. Find it in the Products tab under 'Purchased before'.",
      },
      {
        id: "s4",
        question: "How do I find products on sale?",
        answer:
          "Check the 'Weekly Sale' section on the Home screen or in the Products tab. Sale items are also highlighted with special badges showing the discount amount throughout the app.",
      },
      {
        id: "s5",
        question: "What if an item is out of stock?",
        answer:
          "Out-of-stock items will be marked on the product page and you won't be able to add them to your cart. Add items to your favorites to easily check back when they're restocked.",
      },
      {
        id: "s6",
        question: "Where can I find nutritional information?",
        answer:
          "On the product detail page, tap 'Nutritional Information' (if available) to view detailed nutrition facts including calories, protein, carbohydrates, fats, and more.",
      },
    ],
  },
  {
    title: "Cart & Checkout",
    items: [
      {
        id: "c1",
        question: "How do I place an order?",
        answer:
          "Add items to your cart, then tap the Cart tab to review. Proceed to checkout, select or add a delivery address, choose your delivery method, and complete payment. You'll receive an order confirmation via email and push notification.",
      },
      {
        id: "c2",
        question: "How do I apply a promo code?",
        answer:
          "During checkout, you'll see an option to enter a promo code. Enter your code and tap 'Apply' to see the discount reflected in your order total.",
      },
      {
        id: "c3",
        question: "Can I modify items in my cart?",
        answer:
          "Yes! In the Cart tab, you can adjust quantities using the + and - buttons, or swipe left on an item to remove it. Changes are saved automatically.",
      },
      {
        id: "c4",
        question: "Is there a minimum order value?",
        answer:
          "Minimum order requirements may vary based on your delivery location and chosen delivery method. Any minimum order requirements will be displayed at checkout.",
      },
    ],
  },
  {
    title: "Payment",
    items: [
      {
        id: "p1",
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment gateway. Apple Pay and Google Pay are also supported for quick checkout.",
      },
      {
        id: "p2",
        question: "Is my payment information secure?",
        answer:
          "Absolutely! We use Stripe, a PCI-DSS compliant payment processor. Your card details are encrypted and never stored on our servers. All transactions are secured with industry-standard SSL encryption.",
      },
      {
        id: "p3",
        question: "Are prices inclusive of GST?",
        answer:
          "Yes, all prices displayed in the app are inclusive of 10% GST (Goods and Services Tax) for Australian customers.",
      },
      {
        id: "p4",
        question: "Do you offer discounts or promotions?",
        answer:
          "Yes! Check the Weekly Sale section for current deals. Enable push notifications in Settings to be alerted about exclusive offers and promotions.",
      },
    ],
  },

  {
    title: "Delivery & Pickup",
    items: [
      {
        id: "d1",
        question: "What delivery options are available?",
        answer:
          "We offer standard delivery throughout Australia and local pickup from our Austral location. Delivery options and costs are calculated based on your address and order weight at checkout.",
      },
      {
        id: "d2",
        question: "How long does delivery take?",
        answer:
          "Sydney Metro orders typically arrive within 1-3 business days. Regional areas may take 3-7 business days. Delivery estimates are shown at checkout based on your location.",
      },
      {
        id: "d3",
        question: "Do you offer free shipping?",
        answer:
          "Free shipping is available for orders over a certain amount within eligible areas. The free shipping threshold and eligibility will be displayed at checkout.",
      },
      {
        id: "d4",
        question: "How does local pickup work?",
        answer:
          "Select 'Local Pickup' at checkout. Once your order is ready, you'll receive a notification. Bring your order confirmation to our Austral location during pickup hours (Mon-Fri 5PM-8PM, Sat-Sun 9AM-5PM).",
      },
      {
        id: "d5",
        question: "Can I track my delivery?",
        answer:
          "Yes! Once your order is shipped, you'll receive a tracking number via email and push notification. You can also view tracking information in More > My Orders by tapping on your order.",
      },
    ],
  },
  {
    title: "Orders & History",
    items: [
      {
        id: "o1",
        question: "How do I view my order history?",
        answer:
          "Go to More > My Orders to see all your past and current orders. Tap any order to view full details including items, delivery address, payment information, and tracking status.",
      },
      {
        id: "o2",
        question: "Can I reorder a previous order?",
        answer:
          "Yes! In your order history, tap on a completed order and use the 'Reorder' button to quickly add those items to your cart. You can then modify quantities before checkout.",
      },
      {
        id: "o3",
        question: "Can I modify or cancel my order?",
        answer:
          "Orders can only be modified or cancelled before they are processed. Contact us immediately via phone or email if you need to make changes. Once shipped, you'll need to wait for delivery and initiate a return if needed.",
      },
      {
        id: "o4",
        question: "What do the different order statuses mean?",
        answer:
          "Pending: Order received and awaiting processing. Processing: Order is being prepared. Shipped: Order is on its way. Delivered: Order has been delivered. Cancelled: Order was cancelled.",
      },
    ],
  },
  {
    title: "Reviews & Ratings",
    items: [
      {
        id: "rv1",
        question: "How do I write a product review?",
        answer:
          "You can review products you've purchased. Go to the product page and tap 'Write a Review', or go to More > My Reviews. Rate from 1-5 stars, add a title and your feedback.",
      },
      {
        id: "rv2",
        question: "Can I edit or delete my review?",
        answer:
          "Yes! Go to More > My Reviews to see all your reviews. Tap on any review to edit it, or use the delete option to remove it. You can also edit directly from the product page.",
      },
      {
        id: "rv3",
        question: "What does 'Verified Purchase' mean?",
        answer:
          "A 'Verified Purchase' badge appears on reviews from customers who have actually purchased the product through our store. This helps other shoppers identify authentic reviews.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    items: [
      {
        id: "r1",
        question: "What is your return policy?",
        answer:
          "We accept returns within 7 days of delivery for most items in their original, unopened condition. Perishable items cannot be returned unless there's a quality issue upon delivery.",
      },
      {
        id: "r2",
        question: "How do I initiate a return?",
        answer:
          "Contact our customer service team via the Contact Us page, email (support@darshandelights.com.au), or phone. Provide your order number and reason for return. We'll guide you through the process.",
      },
      {
        id: "r3",
        question: "How long do refunds take?",
        answer:
          "Once we receive and inspect your return, refunds are processed within 5-7 business days. The refund will appear in your original payment method within an additional 3-5 business days depending on your bank.",
      },
      {
        id: "r4",
        question: "What if I received a damaged or wrong item?",
        answer:
          "Please contact us within 48 hours of delivery with photos of the damaged/incorrect item. We'll arrange a replacement or full refund as quickly as possible.",
      },
    ],
  },
  {
    title: "Notifications & Settings",
    items: [
      {
        id: "n1",
        question: "How do I manage push notifications?",
        answer:
          "Go to More > Settings > Notifications to customize which notifications you receive, including order updates, promotions, and new product alerts. You can also manage permissions in your device settings.",
      },
      {
        id: "n2",
        question: "Where can I view my notifications?",
        answer:
          "Tap the bell icon in the app header or go to More > Notifications to view all your notifications. Unread notifications are highlighted, and you can mark all as read or delete individual notifications.",
      },
      {
        id: "n3",
        question: "How do I change the app theme?",
        answer:
          "Go to More > Settings > Appearance to switch between Light, Dark, or System (automatic) theme. The app will follow your device's dark mode setting when set to System.",
      },
    ],
  },
  {
    title: "Technical & Troubleshooting",
    items: [
      {
        id: "t1",
        question: "The app is running slowly. What should I do?",
        answer:
          "Try closing and reopening the app, or check your internet connection. If issues persist, try updating to the latest version of the app from the App Store or Google Play.",
      },
      {
        id: "t2",
        question: "I'm not receiving push notifications. How do I fix this?",
        answer:
          "Ensure notifications are enabled in your device settings for Darshan Delights. Also check More > Settings > Notifications in the app to ensure your preferences are set correctly.",
      },
      {
        id: "t3",
        question: "My payment was declined. What should I do?",
        answer:
          "Please verify your card details are correct and that you have sufficient funds. Try a different payment method or contact your bank. If issues persist, contact our support team.",
      },
      {
        id: "t4",
        question: "How do I report a bug or issue?",
        answer:
          "Go to More > Contact Us and select 'Report a Bug' or email us at support@darshandelights.com.au. Please include details about your device, app version, and steps to reproduce the issue.",
      },
      {
        id: "t5",
        question: "What should I do if I can't log in?",
        answer:
          "First, try resetting your password using 'Forgot Password'. Ensure you're using the correct email address. If you still can't log in, contact support for assistance.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        id: "ps1",
        question: "How is my personal data protected?",
        answer:
          "We take data protection seriously. Your personal information is encrypted and stored securely. We never sell your data to third parties. Read our full Privacy Policy in More > Privacy Policy.",
      },
      {
        id: "ps2",
        question: "Where can I view the Privacy Policy and Terms of Service?",
        answer:
          "Go to More > Privacy Policy and More > Terms of Service to read our full policies. These documents explain how we handle your data and the terms of using our service.",
      },
      {
        id: "ps3",
        question: "How do I sign out of my account?",
        answer:
          "Go to More > Settings and tap 'Sign Out' at the bottom of the screen. You'll need to sign in again to access your account, favorites, and order history.",
      },
    ],
  },
]

const FAQSectionComponent: React.FC<{
  title: string
  items: FAQItem[]
  isTablet: boolean
  config: ReturnType<typeof useResponsive>["config"]
}> = ({ title, items, isTablet, config }) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  )

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <View
      style={[
        styles.sectionContainer,
        {
          marginHorizontal: config.horizontalPadding,
          marginTop: isTablet ? 18 : 16,
          borderRadius: isTablet ? 14 : 12,
        },
      ]}
    >
      <View
        style={[
          styles.sectionHeader,
          {
            paddingVertical: isTablet ? 16 : 14,
            paddingHorizontal: isTablet ? 22 : 20,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { fontSize: config.bodyFontSize }]}>
          {title}
        </Text>
      </View>
      {items.map((item) => (
        <Accordion
          key={item.id}
          question={item.question}
          answer={item.answer}
          isExpanded={expandedItems[item.id] || false}
          onToggle={() => toggleItem(item.id)}
          isTablet={isTablet}
          config={config}
        />
      ))}
    </View>
  )
}

export default function FAQsScreen() {
  const { config, isTablet, isLandscape } = useResponsive()

  // Layout configuration
  const contentMaxWidth = isTablet ? (isLandscape ? 700 : 600) : undefined

  return (
    <Wrapper style={styles.container} edges={[]}>
      {/* Header */}
      <View style={[styles.header, { padding: isTablet ? 24 : 20 }]}>
        <Text
          style={[
            styles.headerTitle,
            { fontSize: isTablet ? 24 : 22, marginBottom: isTablet ? 10 : 8 },
          ]}
        >
          Frequently Asked Questions
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            {
              fontSize: config.bodyFontSize,
              lineHeight: config.bodyFontSize * 1.45,
            },
          ]}
        >
          Find answers to common questions about our products and services
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: isTablet ? 60 : 40,
            maxWidth: contentMaxWidth,
            alignSelf: contentMaxWidth ? "center" : undefined,
            width: contentMaxWidth ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Sections */}
        {FAQ_DATA.map((section, index) => (
          <FAQSectionComponent
            key={index}
            title={section.title}
            items={section.items}
            isTablet={isTablet}
            config={config}
          />
        ))}

        {/* Still Need Help */}
        <View
          style={[
            styles.helpCard,
            {
              marginHorizontal: config.horizontalPadding,
              marginTop: isTablet ? 28 : 24,
              padding: isTablet ? 22 : 20,
              borderRadius: isTablet ? 14 : 12,
            },
          ]}
        >
          <Text
            style={[
              styles.helpTitle,
              { fontSize: isTablet ? 18 : 16, marginBottom: isTablet ? 10 : 8 },
            ]}
          >
            Still have questions?
          </Text>
          <Text
            style={[
              styles.helpText,
              {
                fontSize: config.bodyFontSize,
                lineHeight: config.bodyFontSize * 1.45,
                marginBottom: isTablet ? 14 : 12,
              },
            ]}
          >
            Can't find what you're looking for? Our customer support team is
            here to help.
          </Text>
          <Text
            style={[
              styles.helpContact,
              {
                fontSize: config.bodyFontSize - 1,
                lineHeight: (config.bodyFontSize - 1) * 1.7,
              },
            ]}
          >
            📞 +61 452 550 534{"\n"}
            ✉️ contact@darshandelights.com.au
          </Text>
        </View>
      </ScrollView>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background.secondary,
    borderTopWidth: 0.5,
    borderTopColor: AppColors.gray[200],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  // Header
  header: {
    backgroundColor: AppColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    color: AppColors.text.primary,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  // Section
  sectionContainer: {
    backgroundColor: AppColors.background.primary,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    backgroundColor: AppColors.primary[500],
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  // Help Card
  helpCard: {
    backgroundColor: AppColors.primary[50],
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  helpTitle: {
    fontFamily: "Poppins_600SemiBold",
    color: AppColors.primary[700],
  },
  helpText: {
    fontFamily: "Poppins_400Regular",
    color: AppColors.text.secondary,
  },
  helpContact: {
    fontFamily: "Poppins_500Medium",
    color: AppColors.primary[600],
  },
})
