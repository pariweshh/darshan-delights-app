import React, { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import Wrapper from "@/src/components/common/Wrapper"
import Accordion from "@/src/components/ui/Accordion"
import AppColors from "@/src/constants/Colors"

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
          "You can reach us via phone (+61 452 550 534), email (support@darshandelights.com.au), WhatsApp, or through our Contact Us page. Our customer service team is here to assist you with any enquiries.",
      },
      {
        id: "g3",
        question: "Do I need an account to place an order?",
        answer:
          "Yes, creating an account is required to place orders. This allows you to track orders, view order history, save addresses, and receive personalized offers.",
      },
    ],
  },
  {
    title: "Orders & Shopping",
    items: [
      {
        id: "o1",
        question: "How do I place an order?",
        answer:
          "Browse our products, add items to your cart, and proceed to checkout. Enter your shipping and payment information, review your order, and confirm. You'll receive an email confirmation once your order is placed.",
      },
      {
        id: "o2",
        question: "Can I modify my order after placing it?",
        answer:
          "Changes can only be made if your order hasn't been processed. Please contact us immediately via phone or email if you need to modify your order.",
      },
      {
        id: "o3",
        question: "Can I cancel my order?",
        answer:
          "Orders can be cancelled before they are shipped. Once shipped, you'll need to wait for delivery and then initiate a return. Contact us as soon as possible if you need to cancel.",
      },
      {
        id: "o4",
        question: "What if an item is out of stock?",
        answer:
          "Out-of-stock items will be marked on the product page. You can add items to your wishlist or enable notifications to be alerted when they're back in stock.",
      },
    ],
  },
  {
    title: "Payment & Pricing",
    items: [
      {
        id: "p1",
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit/debit cards (Visa, Mastercard, American Express) through our secure Stripe payment gateway. We also support Apple Pay and Google Pay.",
      },
      {
        id: "p2",
        question: "Do you offer discounts or promo codes?",
        answer:
          "Yes! We regularly offer promotions and discounts. Sign up for our newsletter and follow us on social media to stay updated on the latest deals and exclusive offers.",
      },
      {
        id: "p3",
        question: "Are prices inclusive of GST?",
        answer:
          "Yes, all prices displayed on our website and app are inclusive of 10% GST (Goods and Services Tax) for Australian customers.",
      },
    ],
  },
  {
    title: "Delivery & Shipping",
    items: [
      {
        id: "d1",
        question: "How long does delivery take?",
        answer:
          "Delivery times vary based on your location. Sydney Metro typically receives orders within 1-3 business days. Regional areas may take 3-7 business days. Express shipping options are available at checkout.",
      },
      {
        id: "d2",
        question: "Do you offer free shipping?",
        answer:
          "Free shipping is available for orders over $100 within Sydney Metro area. Shipping costs for other areas are calculated based on weight and destination at checkout.",
      },
      {
        id: "d3",
        question: "Can I track my order?",
        answer:
          "Yes! Once your order is shipped, you'll receive a tracking number via email. You can also track your order status in the app under 'My Orders'.",
      },
      {
        id: "d4",
        question: "What if my order is delayed?",
        answer:
          "If your order hasn't arrived within the expected timeframe, please check your tracking information first. If you need assistance, contact our customer service team and we'll help resolve the issue.",
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
          "We accept returns within 7 days of delivery for most items in their original, unopened condition. Perishable items cannot be returned unless there's a quality issue.",
      },
      {
        id: "r2",
        question: "How do I initiate a return?",
        answer:
          "Contact our customer service team via the Contact Us page or email. Provide your order number and reason for return. We'll guide you through the process.",
      },
      {
        id: "r3",
        question: "How long do refunds take?",
        answer:
          "Once we receive and inspect your return, refunds are processed within 5-7 business days. The refund will appear in your original payment method within an additional 3-5 business days depending on your bank.",
      },
    ],
  },
]

const FAQSection: React.FC<{
  title: string
  items: FAQItem[]
}> = ({ title, items }) => {
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
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((item) => (
        <Accordion
          key={item.id}
          question={item.question}
          answer={item.answer}
          isExpanded={expandedItems[item.id] || false}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </View>
  )
}

export default function FAQsScreen() {
  return (
    <Wrapper style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
          <Text style={styles.headerSubtitle}>
            Find answers to common questions about our products and services
          </Text>
        </View>

        {/* FAQ Sections */}
        {FAQ_DATA.map((section, index) => (
          <FAQSection key={index} title={section.title} items={section.items} />
        ))}

        {/* Still Need Help */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Still have questions?</Text>
          <Text style={styles.helpText}>
            Can't find what you're looking for? Our customer support team is
            here to help.
          </Text>
          <Text style={styles.helpContact}>
            📞 +61 452 550 534{"\n"}
            ✉️ support@darshandelights.com.au
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
  scrollContent: {
    paddingBottom: 40,
  },
  // Header
  header: {
    backgroundColor: AppColors.background.primary,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: AppColors.text.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
  },
  // Section
  sectionContainer: {
    backgroundColor: AppColors.background.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    backgroundColor: AppColors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "white",
  },
  // Help Card
  helpCard: {
    backgroundColor: AppColors.primary[50],
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.primary[200],
  },
  helpTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: AppColors.primary[700],
    marginBottom: 8,
  },
  helpText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: AppColors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  helpContact: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: AppColors.primary[600],
    lineHeight: 22,
  },
})
