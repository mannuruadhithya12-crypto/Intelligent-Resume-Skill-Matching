"""
Enterprise-Grade Skill Database
Supports 500+ skills across multiple industries with synonym mapping
"""

# Comprehensive Skill Database organized by industry/category
SKILLS_DATABASE = {
    # Programming Languages
    "programming": [
        "python", "java", "javascript", "typescript", "c++", "c#", "c", "go", "rust", "kotlin",
        "swift", "objective-c", "ruby", "php", "perl", "scala", "r", "matlab", "julia",
        "dart", "elixir", "haskell", "lua", "groovy", "bash", "shell", "powershell",
        "assembly", "fortran", "cobol", "vb.net", "f#", "clojure", "erlang", "racket"
    ],
    
    # Web Development
    "web_frontend": [
        "html", "css", "react", "angular", "vue.js", "vue", "svelte", "next.js", "nuxt.js",
        "jquery", "bootstrap", "tailwind", "sass", "less", "webpack", "vite", "redux",
        "mobx", "rxjs", "d3.js", "three.js", "webgl", "ember.js", "backbone.js",
        "polymer", "lit", "alpine.js", "htmx", "astro", "qwik", "solid.js"
    ],
    
    "web_backend": [
        "node.js", "express", "django", "flask", "fastapi", "spring boot", "spring",
        "asp.net", ".net core", "laravel", "symfony", "rails", "sinatra", "gin",
        "echo", "fiber", "nest.js", "koa", "hapi", "strapi", "adonis.js",
        "phoenix", "actix", "rocket", "axum", "warp"
    ],
    
    # Mobile Development
    "mobile": [
        "android", "ios", "react native", "flutter", "xamarin", "ionic", "cordova",
        "swift ui", "jetpack compose", "kotlin multiplatform", "capacitor",
        "nativescript", "expo", "phonegap", "titanium"
    ],
    
    # Databases
    "databases": [
        "sql", "mysql", "postgresql", "oracle", "sql server", "mongodb", "cassandra",
        "redis", "elasticsearch", "dynamodb", "couchdb", "neo4j", "influxdb",
        "mariadb", "sqlite", "firestore", "cosmos db", "aurora", "cockroachdb",
        "timescaledb", "clickhouse", "snowflake", "bigquery", "redshift",
        "memcached", "etcd", "consul", "vault", "rethinkdb", "arangodb"
    ],
    
    # Cloud & DevOps
    "cloud": [
        "aws", "azure", "google cloud", "gcp", "alibaba cloud", "digital ocean",
        "heroku", "vercel", "netlify", "cloudflare", "ibm cloud", "oracle cloud",
        "linode", "vultr", "scaleway", "ovh", "hetzner"
    ],
    
    "devops": [
        "docker", "kubernetes", "jenkins", "gitlab ci", "github actions", "circleci",
        "travis ci", "terraform", "ansible", "puppet", "chef", "vagrant", "helm",
        "prometheus", "grafana", "elk stack", "datadog", "new relic", "nagios",
        "splunk", "pagerduty", "argocd", "flux", "rancher", "openshift",
        "nomad", "consul", "vault", "istio", "linkerd", "envoy"
    ],
    
    # Data Science & AI
    "data_science": [
        "machine learning", "deep learning", "nlp", "computer vision", "data analysis",
        "data mining", "big data", "hadoop", "spark", "kafka", "airflow", "dbt",
        "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly", "tableau",
        "power bi", "looker", "qlik", "excel", "statistics", "probability",
        "data warehousing", "etl", "data pipeline", "feature engineering",
        "model deployment", "mlops", "a/b testing", "experimentation"
    ],
    
    "ai_ml_frameworks": [
        "tensorflow", "pytorch", "keras", "scikit-learn", "xgboost", "lightgbm",
        "catboost", "hugging face", "transformers", "bert", "gpt", "llm",
        "opencv", "yolo", "detectron", "spacy", "nltk", "gensim", "fastai",
        "jax", "mxnet", "caffe", "theano", "paddlepaddle", "onnx", "mlflow",
        "kubeflow", "ray", "dask", "rapids", "optuna", "wandb"
    ],
    
    # Business & Management
    "business": [
        "project management", "agile", "scrum", "kanban", "jira", "confluence",
        "product management", "business analysis", "requirements gathering",
        "stakeholder management", "risk management", "change management",
        "strategic planning", "budgeting", "forecasting", "pmp", "prince2",
        "six sigma", "lean", "kaizen", "okr", "kpi", "roadmapping",
        "user stories", "backlog management", "sprint planning", "retrospectives",
        "business intelligence", "data governance", "process improvement"
    ],
    
    # Marketing & Sales
    "marketing": [
        "digital marketing", "seo", "sem", "social media marketing", "content marketing",
        "email marketing", "marketing automation", "google analytics", "google ads",
        "facebook ads", "linkedin ads", "hubspot", "salesforce", "marketo",
        "mailchimp", "hootsuite", "buffer", "canva", "adobe creative suite",
        "photoshop", "illustrator", "indesign", "premiere pro", "after effects",
        "copywriting", "brand strategy", "market research", "customer segmentation",
        "conversion optimization", "growth hacking", "influencer marketing",
        "affiliate marketing", "ppc", "display advertising", "retargeting"
    ],
    
    # Design
    "design": [
        "ui design", "ux design", "graphic design", "web design", "figma", "sketch",
        "adobe xd", "invision", "zeplin", "wireframing", "prototyping",
        "user research", "usability testing", "design thinking", "typography",
        "color theory", "branding", "logo design", "motion graphics",
        "interaction design", "information architecture", "responsive design",
        "accessibility", "design systems", "material design", "human interface guidelines"
    ],
    
    # Finance & Accounting
    "finance": [
        "accounting", "financial analysis", "financial modeling", "budgeting",
        "forecasting", "quickbooks", "sap", "oracle financials", "excel modeling",
        "gaap", "ifrs", "cpa", "cfa", "frm", "taxation", "audit", "compliance",
        "financial reporting", "variance analysis", "cost accounting", "management accounting",
        "treasury", "cash flow management", "investment analysis", "portfolio management",
        "risk assessment", "internal controls", "sox compliance"
    ],
    
    # Healthcare
    "healthcare": [
        "clinical research", "medical coding", "hipaa", "ehr", "emr", "epic",
        "cerner", "meditech", "nursing", "patient care", "medical terminology",
        "pharmacology", "radiology", "laboratory", "healthcare administration",
        "medical billing", "icd-10", "cpt coding", "clinical trials",
        "regulatory compliance", "fda regulations", "gcp", "clinical documentation",
        "telemedicine", "health informatics", "population health"
    ],
    
    # Legal
    "legal": [
        "contract law", "corporate law", "intellectual property", "litigation",
        "legal research", "legal writing", "compliance", "regulatory affairs",
        "paralegal", "legal tech", "westlaw", "lexisnexis", "e-discovery",
        "due diligence", "mergers and acquisitions", "employment law",
        "data privacy", "gdpr", "ccpa", "contract negotiation", "dispute resolution"
    ],
    
    # Soft Skills
    "soft_skills": [
        "communication", "leadership", "teamwork", "problem solving",
        "critical thinking", "creativity", "adaptability", "time management",
        "conflict resolution", "negotiation", "presentation", "public speaking",
        "emotional intelligence", "collaboration", "mentoring", "coaching",
        "decision making", "strategic thinking", "analytical skills", "attention to detail",
        "multitasking", "stress management", "work ethic", "interpersonal skills",
        "customer service", "active listening", "empathy", "flexibility"
    ],
    
    # Security
    "security": [
        "cybersecurity", "information security", "network security", "penetration testing",
        "ethical hacking", "vulnerability assessment", "siem", "firewall", "ids", "ips",
        "encryption", "pki", "ssl", "tls", "oauth", "saml", "cissp", "ceh", "oscp",
        "security+", "cism", "cisa", "incident response", "threat intelligence",
        "malware analysis", "forensics", "security architecture", "zero trust",
        "devsecops", "application security", "cloud security", "identity management"
    ],
    
    # Networking
    "networking": [
        "tcp/ip", "dns", "dhcp", "vpn", "routing", "switching", "cisco", "juniper",
        "ccna", "ccnp", "network administration", "load balancing", "cdn",
        "bgp", "ospf", "mpls", "vlan", "wan", "lan", "wireless", "5g",
        "network monitoring", "packet analysis", "wireshark", "network design"
    ],
    
    # Quality Assurance
    "qa": [
        "quality assurance", "testing", "manual testing", "automation testing",
        "selenium", "cypress", "jest", "mocha", "junit", "testng", "cucumber",
        "postman", "jmeter", "loadrunner", "test planning", "test cases",
        "bug tracking", "regression testing", "performance testing", "api testing",
        "integration testing", "unit testing", "end-to-end testing", "smoke testing",
        "sanity testing", "acceptance testing", "exploratory testing"
    ],
    
    # E-commerce & Retail
    "ecommerce": [
        "shopify", "magento", "woocommerce", "bigcommerce", "salesforce commerce",
        "inventory management", "order fulfillment", "payment gateways", "stripe",
        "paypal", "product catalog", "merchandising", "pricing strategy",
        "customer retention", "loyalty programs", "omnichannel"
    ],
    
    # Education & Training
    "education": [
        "curriculum development", "instructional design", "e-learning", "lms",
        "moodle", "blackboard", "canvas", "training delivery", "assessment",
        "adult learning", "pedagogy", "educational technology", "virtual classroom"
    ],
    
    # Manufacturing & Operations
    "manufacturing": [
        "supply chain", "logistics", "procurement", "inventory control",
        "lean manufacturing", "continuous improvement", "quality control",
        "production planning", "erp", "mrp", "warehouse management",
        "demand forecasting", "vendor management", "operations management"
    ],
    
    # Real Estate & Construction
    "real_estate": [
        "property management", "real estate analysis", "construction management",
        "project scheduling", "cost estimation", "autocad", "revit", "bim",
        "building codes", "contract administration", "site management"
    ]
}

# Skill Synonyms and Variations
SKILL_SYNONYMS = {
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "k8s": "kubernetes",
    "ml": "machine learning",
    "dl": "deep learning",
    "ai": "artificial intelligence",
    "cv": "computer vision",
    "nlp": "natural language processing",
    "db": "database",
    "rdbms": "relational database",
    "nosql": "non-relational database",
    "ci/cd": "continuous integration",
    "devops": "development operations",
    "sre": "site reliability engineering",
    "pm": "project management",
    "ba": "business analysis",
    "qa": "quality assurance",
    "ux": "user experience",
    "ui": "user interface",
    "api": "application programming interface",
    "rest": "restful api",
    "graphql": "graph query language",
    "aws": "amazon web services",
    "gcp": "google cloud platform",
    "azure": "microsoft azure"
}

def get_all_skills():
    """Returns a flat list of all skills from all categories"""
    all_skills = []
    for category_skills in SKILLS_DATABASE.values():
        all_skills.extend(category_skills)
    return list(set(all_skills))

def normalize_skill(skill_text):
    """Normalize skill text using synonym mapping"""
    skill_lower = skill_text.lower().strip()
    return SKILL_SYNONYMS.get(skill_lower, skill_lower)

def extract_skills(text):
    """
    Extract skills from text with improved matching and synonym support
    """
    if not text:
        return []
    
    text_lower = text.lower()
    skills_found = []
    all_skills = get_all_skills()
    
    # Add synonyms to search space
    search_terms = all_skills + list(SKILL_SYNONYMS.keys())
    
    for skill in search_terms:
        # Normalize the skill
        normalized = normalize_skill(skill)
        
        # Check for exact match with word boundaries
        import re
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            if normalized not in skills_found:
                skills_found.append(normalized)
        # Also check for the skill as part of compound terms
        elif skill in text_lower and len(skill) > 4:
            if normalized not in skills_found:
                skills_found.append(normalized)
    
    return list(set(skills_found))

def get_skills_by_category(category):
    """Get skills for a specific category"""
    return SKILLS_DATABASE.get(category, [])

def categorize_skills(skills_list):
    """Categorize a list of skills"""
    categorized = {}
    for category, category_skills in SKILLS_DATABASE.items():
        matched = [s for s in skills_list if s in category_skills]
        if matched:
            categorized[category] = matched
    return categorized

# Backward compatibility: maintain SKILLS_DB for existing code
SKILLS_DB = get_all_skills()
