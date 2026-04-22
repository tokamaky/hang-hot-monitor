import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

let mailTransporter = null;

/**
 * 初始化邮件服务
 */
function getMailTransporter() {
  if (mailTransporter) {
    return mailTransporter;
  }

  try {
    mailTransporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });

    logger.success('✉️  Email service initialized');
  } catch (error) {
    logger.error('Email service initialization failed:', error.message);
  }

  return mailTransporter;
}

/**
 * 发送热点通知邮件
 */
export async function sendHotspotNotification(keyword, hotspot) {
  if (!config.notificationEmail || !config.smtp.user) {
    logger.warn('Email notification not configured');
    return false;
  }

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      return false;
    }

    const emailContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; }
          .content { margin-top: 20px; }
          .hotspot { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0; }
          .title { font-size: 18px; font-weight: bold; color: #333; }
          .source { color: #666; font-size: 12px; margin-top: 5px; }
          .snippet { color: #555; margin-top: 10px; line-height: 1.6; }
          .link { margin-top: 10px; }
          .link a { color: #4CAF50; text-decoration: none; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔥 新热点通知</h2>
          </div>
          <div class="content">
            <p>您关注的关键词 <strong>"${keyword}"</strong> 有新的热点！</p>
            <div class="hotspot">
              <div class="title">${hotspot.title}</div>
              <div class="source">来源: ${hotspot.source.toUpperCase()} | ${new Date(hotspot.created_at).toLocaleString('zh-CN')}</div>
              <div class="snippet">${hotspot.snippet || hotspot.content || '(内容预览)'}</div>
              ${hotspot.url ? `<div class="link"><a href="${hotspot.url}" target="_blank">查看详情 →</a></div>` : ''}
            </div>
          </div>
          <div class="footer">
            <p>这是来自 热点监控系统 的自动通知</p>
          </div>
        </div>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: config.smtp.from,
      to: config.notificationEmail,
      subject: `🔥 新热点: ${keyword}`,
      html: emailContent,
    });

    logger.success(`✉️  Email notification sent for keyword: "${keyword}"`);
    return true;
  } catch (error) {
    logger.error('Error sending email notification:', error.message);
    return false;
  }
}

/**
 * 发送每日摘要邮件
 */
export async function sendDailySummaryEmail(hotspots, stats) {
  if (!config.notificationEmail || !config.smtp.user) {
    logger.warn('Email notification not configured');
    return false;
  }

  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      return false;
    }

    const hotspotsHtml = hotspots
      .map(
        (h) => `
        <div class="hotspot">
          <div class="title">${h.title}</div>
          <div class="source">${h.source.toUpperCase()} | ${new Date(h.created_at).toLocaleString('zh-CN')}</div>
          ${h.url ? `<div class="link"><a href="${h.url}" target="_blank">查看 →</a></div>` : ''}
        </div>
      `
      )
      .join('');

    const emailContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; border-radius: 5px; }
          .stats { background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .stat-item { display: inline-block; margin-right: 20px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #2196F3; }
          .hotspot { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2196F3; margin: 10px 0; }
          .title { font-weight: bold; color: #333; }
          .source { color: #666; font-size: 12px; margin-top: 5px; }
          .link { margin-top: 10px; }
          .link a { color: #2196F3; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📊 每日热点摘要</h2>
          </div>
          <div class="stats">
            <div class="stat-item">
              <div class="stat-number">${stats.newHotspots}</div>
              <div>新热点</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.totalHotspots}</div>
              <div>总热点</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.keywordsMonitoring}</div>
              <div>监控词</div>
            </div>
          </div>
          <div>
            <h3>最新热点</h3>
            ${hotspotsHtml}
          </div>
          <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>这是来自 热点监控系统 的每日自动摘要</p>
          </div>
        </div>
      </body>
    </html>
    `;

    await transporter.sendMail({
      from: config.smtp.from,
      to: config.notificationEmail,
      subject: `📊 每日热点摘要 - ${new Date().toLocaleDateString('zh-CN')}`,
      html: emailContent,
    });

    logger.success('✉️  Daily summary email sent');
    return true;
  } catch (error) {
    logger.error('Error sending summary email:', error.message);
    return false;
  }
}

export default {
  sendHotspotNotification,
  sendDailySummaryEmail,
};
