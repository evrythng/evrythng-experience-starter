const evt = require('evrythng-extended');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

if (require.main === module) {
  const experience = readExperience(getArg('--experience'));
  const productId = getArg('--productId');
  const apiKey = getArg('--apiKey');
  
  uploadExperience(apiKey, productId, experience);
} else {
  module.exports = {
    uploadExperience
  };
}

//////////////////////////////////////////////////////////////

function getArg(name) {
  return (
    process.argv.find(arg => arg.startsWith(name)) || ''
  )
    .split('=')[1];
}

function readExperience(name) {
  const availableExperiences = fs.readdirSync(path.resolve(__dirname, '../experiences'));
  const targetExperience = availableExperiences.find(experience => experience.startsWith(name));

  if (!targetExperience) {
    throw new Error(`Target experience ${name} is not found.`)
  }
  
  return String(
    fs.readFileSync(
      path.resolve(__dirname, '../experiences', targetExperience)
    )
  );
}

function uploadExperience(apiKey, productId, experience) {
  if (!apiKey) {
    throw new Error('API Key is required to update the experience');
  }

  if (!productId) {
    throw new Error('Product ID is required to update the experience');
  }

  const operator = new evt.Operator(apiKey);
  const $ = cheerio.load(experience);
  const dependencies = [];

  $('script')
    .each((i, el) => {
      el = $(el);

      if (el.attr('src')) {
        dependencies.push(el.attr('src'));
        el.remove();
      }
    });

  experience = $.html();

  return operator
    .product(productId)
    .update({
      customFields: {
        'product_experience_type': 'custom',
        'custom_experience_scripts': dependencies,
        'custom_experience': experience
      }
    });
}